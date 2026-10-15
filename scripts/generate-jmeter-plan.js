const fs = require('node:fs');
const path = require('node:path');

const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const prop = (name, value) => `<stringProp name="${name}">${escape(value)}</stringProp>`;
const bool = (name, value) => `<boolProp name="${name}">${value}</boolProp>`;
const tree = (element, children = '') => `${element}<hashTree>${children}</hashTree>`;
const variable = (name) => `\${${name}}`;
const environment = (name) => `\${__groovy(System.getenv('${name}'))}`;

const userVariables = {
  apiHost: '${__P(host,127.0.0.1)}',
  apiPort: '${__P(port,3100)}',
  clientName: 'Cliente JMeter',
  clientEmail: environment('JMETER_CLIENT_EMAIL'),
  clientPassword: environment('JMETER_CLIENT_PASSWORD'),
  adminEmail: environment('ADMIN_EMAIL'),
  adminPassword: environment('ADMIN_PASSWORD'),
  categoryName: `JMeter ${environment('JMETER_RUN_ID')}`,
  updatedCategoryName: `JMeter Updated ${environment('JMETER_RUN_ID')}`,
  availableProductId: '2',
  unavailableProductId: '1',
  orderPhone: '8888-8888',
  orderAddress: 'Prueba JMeter',
  loadThreads: '10',
  loadRampSeconds: '10',
  loadDurationSeconds: '60',
  targetRequestsPerMinute: '300',
};

const userDefinedVariables = Object.entries(userVariables).map(([name, value]) =>
  `<elementProp name="${escape(name)}" elementType="Argument">${prop('Argument.name', name)}${prop('Argument.value', value)}${prop('Argument.metadata', '=')}</elementProp>`).join('');

function postProcessor(bindings) {
  if (!bindings) return '';
  const script = `import groovy.json.JsonSlurper\ntry {\n` +
    `def json = new JsonSlurper().parseText(prev.getResponseDataAsString())\n` +
    `if (json.ok != true) throw new AssertionError('ok != true')\n` +
    Object.entries(bindings).map(([key, expression]) =>
      `if (${expression} == null) throw new AssertionError('Missing ${key}')\nvars.put('${key}', String.valueOf(${expression}))\n`).join('') +
    `} catch (Throwable error) { prev.setSuccessful(false); prev.setResponseMessage('JSON validation: ' + error.getMessage()) }\n`;
  return tree(`<JSR223PostProcessor guiclass="TestBeanGUI" testclass="JSR223PostProcessor" testname="Extract and validate JSON" enabled="true">${prop('scriptLanguage', 'groovy')}${prop('script', script)}</JSR223PostProcessor>`);
}

function assertion(field, pattern, name, assumeSuccess = false) {
  const type = field === 'Assertion.response_code' ? 8 : 16;
  return tree(`<ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="${escape(name)}" enabled="true"><collectionProp name="Asserion.test_strings"><stringProp name="0">${escape(pattern)}</stringProp></collectionProp>${prop('Assertion.test_field', field)}${bool('Assertion.assume_success', assumeSuccess)}<intProp name="Assertion.test_type">${type}</intProp></ResponseAssertion>`);
}

function sampler(label, method, route, { body = '', status = 200, token = '', bindings = null, json = true, expectedError = '' } = {}) {
  const raw = body ? `<boolProp name="HTTPSampler.postBodyRaw">true</boolProp><elementProp name="HTTPsampler.Arguments" elementType="Arguments"><collectionProp name="Arguments.arguments"><elementProp name="" elementType="HTTPArgument">${bool('HTTPArgument.always_encode', false)}${prop('Argument.value', body)}${prop('Argument.metadata', '=')}</elementProp></collectionProp></elementProp>` : `<elementProp name="HTTPsampler.Arguments" elementType="Arguments"><collectionProp name="Arguments.arguments"/></elementProp>`;
  const header = tree(`<HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Request headers" enabled="true"><collectionProp name="HeaderManager.headers"><elementProp name="Content-Type" elementType="Header">${prop('Header.name', 'Content-Type')}${prop('Header.value', 'application/json')}</elementProp>${token ? `<elementProp name="Authorization" elementType="Header">${prop('Header.name', 'Authorization')}${prop('Header.value', `Bearer \${${token}}`)}</elementProp>` : ''}</collectionProp></HeaderManager>`);
  const request = `<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${escape(label)}" enabled="true">${raw}${prop('HTTPSampler.domain', variable('apiHost'))}${prop('HTTPSampler.port', variable('apiPort'))}${prop('HTTPSampler.protocol', 'http')}${prop('HTTPSampler.path', route)}${prop('HTTPSampler.method', method)}${bool('HTTPSampler.follow_redirects', false)}${bool('HTTPSampler.auto_redirects', false)}${bool('HTTPSampler.use_keepalive', true)}${bool('HTTPSampler.DO_MULTIPART_POST', false)}${prop('HTTPSampler.embedded_url_re', '')}${prop('HTTPSampler.connect_timeout', '5000')}${prop('HTTPSampler.response_timeout', '15000')}</HTTPSamplerProxy>`;
  const checks = assertion('Assertion.response_code', String(status), `HTTP ${status}`, Boolean(expectedError)) +
    (expectedError ? assertion('Assertion.response_data', '"ok":false', 'ok false') + assertion('Assertion.response_data', expectedError, expectedError) :
      (json && status !== 204 ? assertion('Assertion.response_data', '"ok":true', 'ok true') : ''));
  return tree(request, header + checks + postProcessor(bindings));
}

const functional = [
  sampler('F01 GET /api/health', 'GET', '/api/health', { bindings: { service: 'json.service' } }),
  sampler('F02 POST /api/auth/register', 'POST', '/api/auth/register', { body: `{"nombre":"${variable('clientName')}","correo":"${variable('clientEmail')}","password":"${variable('clientPassword')}"}`, status: 201, bindings: { clientId: 'json.user.id', clientToken: 'json.token' } }),
  sampler('F03 POST /api/auth/login cliente', 'POST', '/api/auth/login', { body: `{"correo":"${variable('clientEmail')}","password":"${variable('clientPassword')}"}`, bindings: { clientToken: 'json.token' } }),
  sampler('F04 POST /api/auth/login admin', 'POST', '/api/auth/login', { body: `{"correo":"${variable('adminEmail')}","password":"${variable('adminPassword')}"}`, bindings: { adminToken: 'json.token' } }),
  sampler('F05 GET /api/categories', 'GET', '/api/categories', { bindings: { categoryCount: 'json.data.size()' } }),
  sampler('F06 POST /api/categories', 'POST', '/api/categories', { body: `{"nombre":"${variable('categoryName')}"}`, status: 201, token: 'adminToken', bindings: { categoryId: 'json.data._id' } }),
  sampler('F07 PUT /api/categories/:id', 'PUT', '/api/categories/${categoryId}', { body: `{"nombre":"${variable('updatedCategoryName')}"}`, token: 'adminToken', bindings: { updatedCategory: 'json.data.nombre' } }),
  sampler('F08 GET /api/products', 'GET', '/api/products', { bindings: { productCount: 'json.data.size()' } }),
  sampler('F09 POST /api/products', 'POST', '/api/products', { body: `{"nombre":"Producto JMeter","categoria":"${variable('updatedCategoryName')}","precio":1200,"stock":4,"disponible":true}`, status: 201, token: 'adminToken', bindings: { productId: 'json.data._id' } }),
  sampler('F10 GET /api/products/:id', 'GET', '/api/products/${productId}', { bindings: { productName: 'json.data.nombre' } }),
  sampler('F11 PUT /api/products/:id', 'PUT', '/api/products/${productId}', { body: '{"nombre":"Producto JMeter actualizado","precio":1300,"stock":0}', token: 'adminToken', bindings: { updatedProduct: 'json.data.nombre' } }),
  sampler('N01 POST /api/cart/items stock cero', 'POST', '/api/cart/items', { body: '{"productId":"${productId}","cantidad":1}', status: 400, token: 'clientToken', expectedError: 'Cantidad no disponible' }),
  sampler('N02 POST /api/cart/items no disponible', 'POST', '/api/cart/items', { body: `{"productId":${variable('unavailableProductId')},"cantidad":1}`, status: 409, token: 'clientToken', expectedError: 'El producto no está disponible' }),
  sampler('F12 GET /api/products?search', 'GET', '/api/products?search=JMeter', { bindings: { filteredCount: 'json.data.size()' } }),
  sampler('F13 DELETE /api/products/:id', 'DELETE', '/api/products/${productId}', { status: 204, token: 'adminToken', json: false }),
  sampler('F14 DELETE /api/categories/:id', 'DELETE', '/api/categories/${categoryId}', { status: 204, token: 'adminToken', json: false }),
  sampler('F15 GET /api/cart', 'GET', '/api/cart', { token: 'clientToken', bindings: { cartId: 'json.data._id' } }),
  sampler('F16 POST /api/cart/items', 'POST', '/api/cart/items', { body: `{"productId":${variable('availableProductId')},"cantidad":1}`, status: 201, token: 'clientToken', bindings: { cartItems: 'json.data.items.size()' } }),
  sampler('F17 PUT /api/cart/items/:productId', 'PUT', `/api/cart/items/${variable('availableProductId')}`, { body: '{"cantidad":2}', status: 201, token: 'clientToken', bindings: { cartUpdatedItems: 'json.data.items.size()' } }),
  sampler('F18 DELETE /api/cart/items/:productId', 'DELETE', `/api/cart/items/${variable('availableProductId')}`, { token: 'clientToken', bindings: { cartRemovedItems: 'json.data.items.size()' } }),
  sampler('F19 POST /api/cart/items before order', 'POST', '/api/cart/items', { body: `{"productId":${variable('availableProductId')},"cantidad":1}`, status: 201, token: 'clientToken' }),
  sampler('F20 POST /api/orders', 'POST', '/api/orders', { body: `{"telefono":"${variable('orderPhone')}","direccion":"${variable('orderAddress')}"}`, status: 201, token: 'clientToken', bindings: { orderId: 'json.data._id' } }),
  sampler('F21 GET /api/orders', 'GET', '/api/orders', { token: 'clientToken', bindings: { orderCount: 'json.data.size()' } }),
  sampler('F22 GET /api/orders/user/:userId', 'GET', '/api/orders/user/${clientId}', { token: 'clientToken', bindings: { userOrderCount: 'json.data.size()' } }),
  sampler('F23 GET /api/orders/:id', 'GET', '/api/orders/${orderId}', { token: 'clientToken', bindings: { orderNumber: 'json.data.numero' } }),
  sampler('F24 PATCH /api/orders/:id/status', 'PATCH', '/api/orders/${orderId}/status', { body: '{"estado":"En preparación"}', token: 'adminToken', bindings: { orderStatus: 'json.data.estado' } }),
  sampler('F25 DELETE /api/cart', 'DELETE', '/api/cart', { status: 204, token: 'clientToken', json: false }),
  sampler('F26 GET /api/currency/convert', 'GET', '/api/currency/convert?amount=1000&from=crc&to=usd', { bindings: { conversionResult: 'json.data.result' } }),
];

const load = [
  sampler('L01 GET /api/health', 'GET', '/api/health'),
  sampler('L02 GET /api/products', 'GET', '/api/products'),
  sampler('L03 GET /api/products/:id', 'GET', `/api/products/${variable('unavailableProductId')}`),
  sampler('L04 GET /api/categories', 'GET', '/api/categories'),
];

function group(name, children, threads, ramp, duration) {
  const scheduler = duration !== 0;
  const groupXml = `<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="${escape(name)}" enabled="true">${prop('ThreadGroup.on_sample_error', 'continue')}<elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">${bool('LoopController.continue_forever', scheduler)}${prop('LoopController.loops', scheduler ? '-1' : '1')}</elementProp>${prop('ThreadGroup.num_threads', threads)}${prop('ThreadGroup.ramp_time', ramp)}${bool('ThreadGroup.scheduler', scheduler)}${prop('ThreadGroup.duration', duration || '')}${prop('ThreadGroup.delay', '0')}${bool('ThreadGroup.same_user_on_next_iteration', true)}</ThreadGroup>`;
  const timer = scheduler ? tree(`<ConstantThroughputTimer guiclass="TestBeanGUI" testclass="ConstantThroughputTimer" testname="Target requests per minute" enabled="true">${prop('throughput', variable('targetRequestsPerMinute'))}<intProp name="calcMode">1</intProp></ConstantThroughputTimer>`) : '';
  return tree(groupXml, timer + children.join(''));
}

const testPlan = `<TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Distrito Cosmetico API" enabled="true">${prop('TestPlan.comments', 'Edit User Defined Variables to configure target, test data and load')}${bool('TestPlan.functional_mode', false)}${bool('TestPlan.tearDown_on_shutdown', true)}${bool('TestPlan.serialize_threadgroups', true)}<elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true"><collectionProp name="Arguments.arguments">${userDefinedVariables}</collectionProp></elementProp>${prop('TestPlan.user_define_classpath', '')}</TestPlan>`;
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3"><hashTree>${tree(testPlan, group('Functional API coverage', functional, 1, 1, 0) + group('Moderate read load', load, variable('loadThreads'), variable('loadRampSeconds'), variable('loadDurationSeconds')))}</hashTree></jmeterTestPlan>\n`;
const output = path.resolve(__dirname, '../jmeter/distrito-cosmetico.jmx');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, xml);
console.log(output);
