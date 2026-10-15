require('dotenv').config({ quiet: true });

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const mongoose = require('mongoose');

const root = path.resolve(__dirname, '..');
const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, '')}_${randomBytes(4).toString('hex')}`;
const database = `distrito_cosmetico_jmeter_${runId.toLowerCase()}`;
const output = path.join(root, 'reports', 'jmeter', runId);
const jtl = path.join(output, 'results.jtl');
const dashboard = path.join(output, 'dashboard');
const plan = path.join(root, 'jmeter', 'distrito-cosmetico.jmx');
const jmeterHome = process.env.JMETER_HOME || path.resolve(root, '../apache-jmeter-5.6.3/apache-jmeter-5.6.3');
const jmeterBat = path.join(jmeterHome, 'bin', process.platform === 'win32' ? 'jmeter.bat' : 'jmeter');
const bundledJava21 = 'C:\\Program Files\\Java\\jdk-21';

function isolatedUri() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI no está configurado');
  const uri = new URL(process.env.MONGODB_URI);
  if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol)) throw new Error('MONGODB_URI inválido');
  const originalDb = uri.pathname.replace(/^\//, '') || 'admin';
  const authSource = uri.searchParams.get('authSource') || originalDb;
  uri.pathname = `/${database}`;
  uri.searchParams.set('authSource', authSource);
  return uri.toString();
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function child(command, args, env, logFile) {
  const log = fs.createWriteStream(logFile);
  const processHandle = spawn(command, args, { cwd: root, env, windowsHide: true });
  processHandle.stdout.pipe(log);
  processHandle.stderr.pipe(log);
  const completion = new Promise((resolve, reject) => {
    processHandle.once('error', reject);
    processHandle.once('exit', (code, signal) => resolve({ code, signal }));
  }).finally(() => log.end());
  return { processHandle, completion };
}

async function waitForHealth(port, server) {
  const url = `http://127.0.0.1:${port}/api/health`;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.processHandle.exitCode !== null) throw new Error('La API terminó antes de responder health');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* waiting for startup */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('La API no respondió health en 20 segundos');
}

function parseCsv(content) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (quoted && content[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && content[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, i) => [header, values[i] || ''])));
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.ceil((p / 100) * sorted.length) - 1];
}

function stats(rows) {
  const times = rows.map((row) => Number(row.elapsed)).filter(Number.isFinite).sort((a, b) => a - b);
  const failures = rows.filter((row) => row.success !== 'true');
  const stamps = rows.map((row) => Number(row.timeStamp)).filter(Number.isFinite);
  const span = stamps.length ? Math.max(1, (Math.max(...stamps) - Math.min(...stamps)) / 1000) : 1;
  return { count: rows.length, failures: failures.length, p50: percentile(times, 50), p95: percentile(times, 95), p99: percentile(times, 99), rps: +(rows.length / span).toFixed(2) };
}

function summarize(exitCode, note) {
  const rows = fs.existsSync(jtl) ? parseCsv(fs.readFileSync(jtl, 'utf8')) : [];
  const functional = rows.filter((row) => /^F\d+ /.test(row.label));
  const expectedErrors = rows.filter((row) => /^N\d+ /.test(row.label));
  const load = rows.filter((row) => /^L\d+ /.test(row.label));
  const functionalLabels = [...new Set(functional.map((row) => row.label))];
  const failed = rows.filter((row) => row.success !== 'true');
  const byLabel = new Map();
  for (const row of rows) {
    if (!byLabel.has(row.label)) byLabel.set(row.label, []);
    byLabel.get(row.label).push(row);
  }
  const lines = [
    '# Análisis automático de JMeter', '',
    `- Corrida: ${runId}`,
    `- Resultado del proceso JMeter: ${exitCode === 0 ? 'completado' : `falló (${exitCode})`}`,
    `- Cobertura funcional: ${functionalLabels.length}/26 pasos; 23 rutas previstas`,
    `- Rechazos esperados por producto sin stock o no disponible: ${expectedErrors.filter((row) => row.success === 'true').length}/2`,
    `- Muestras: ${rows.length}; fallidas inesperadas: ${failed.length}`,
    `- Dashboard: [abrir](dashboard/index.html)`,
    '', '| Grupo | Muestras | Fallos | p50 ms | p95 ms | p99 ms | Solicitudes/s |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const [name, group] of [['Funcional', functional], ['Rechazos esperados', expectedErrors], ['Carga de lectura', load]]) {
    const s = stats(group);
    lines.push(`| ${name} | ${s.count} | ${s.failures} | ${s.p50} | ${s.p95} | ${s.p99} | ${s.rps} |`);
  }
  lines.push('', '## Por solicitud', '', '| Solicitud | Muestras | Fallos | p95 ms | Códigos HTTP |', '| --- | ---: | ---: | ---: | --- |');
  for (const [label, group] of byLabel) {
    const s = stats(group);
    const codes = [...new Set(group.map((row) => row.responseCode))].join(', ');
    lines.push(`| ${label.replace(/\|/g, '\\|')} | ${s.count} | ${s.failures} | ${s.p95} | ${codes} |`);
  }
  lines.push('', '## Fallos y observaciones', '');
  if (note) lines.push(`- Preparación o ejecución: ${note}`);
  if (!failed.length) lines.push('- No se registraron muestras fallidas inesperadas. Los HTTP 400 y 409 previstos cuentan como pruebas correctas cuando coinciden el código y el mensaje.');
  else for (const row of failed.slice(0, 30)) lines.push(`- ${row.label}: HTTP ${row.responseCode}; ${String(row.failureMessage || row.responseMessage || 'sin detalle').replace(/[\r\n]+/g, ' ').slice(0, 250)}`);
  if (failed.length > 30) lines.push(`- Se omitieron ${failed.length - 30} fallos adicionales; consultar results.jtl.`);
  const currency = functional.find((row) => row.label === 'F26 GET /api/currency/convert');
  if (currency) lines.push(`- Conversión externa: HTTP ${currency.responseCode}; ${currency.success === 'true' ? 'correcta' : 'falló y depende de un proveedor externo'}.`);
  lines.push('');
  fs.writeFileSync(path.join(output, 'analysis.md'), lines.join('\n'));
  return { rows, functional, expectedErrors, load, failed };
}

async function main() {
  if (!fs.existsSync(plan)) throw new Error(`No existe el plan JMeter: ${plan}`);
  if (!fs.existsSync(jmeterBat)) throw new Error(`No existe JMeter: ${jmeterBat}`);
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) throw new Error('Faltan ADMIN_EMAIL o ADMIN_PASSWORD en .env');
  const uri = isolatedUri();
  const port = await freePort();
  const env = { ...process.env, MONGODB_URI: uri, PORT: String(port), JMETER_RUN_ID: runId, JMETER_CLIENT_EMAIL: `jmeter_${runId.toLowerCase()}@example.test`, JMETER_CLIENT_PASSWORD: randomBytes(24).toString('hex'), JMETER_BAT: jmeterBat, JMETER_PLAN: plan, JMETER_JTL: jtl, JMETER_REPORT: dashboard, JMETER_PORT: String(port) };
  const javaHome = process.env.JMETER_JAVA_HOME || (fs.existsSync(path.join(bundledJava21, 'bin', 'java.exe')) ? bundledJava21 : process.env.JAVA_HOME);
  if (javaHome) {
    env.JAVA_HOME = javaHome;
    env.Path = `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.Path || process.env.PATH || ''}`;
  }
  fs.mkdirSync(output, { recursive: true });
  let server, exitCode = -1, note = '';
  try {
    const seed = child(process.execPath, ['src/seed/seed.js'], env, path.join(output, 'seed.log'));
    const seedResult = await seed.completion;
    if (seedResult.code !== 0) throw new Error(`El seed falló (${seedResult.code}); revisar seed.log`);
    server = child(process.execPath, ['src/server.js'], env, path.join(output, 'api.log'));
    await waitForHealth(port, server);
    const command = process.platform === 'win32' ? 'powershell.exe' : jmeterBat;
    const args = process.platform === 'win32'
      ? ['-NoProfile', '-NonInteractive', '-Command', '& $env:JMETER_BAT -n -t $env:JMETER_PLAN -l $env:JMETER_JTL -e -o $env:JMETER_REPORT "-Jhost=127.0.0.1" "-Jport=$env:JMETER_PORT"']
      : ['-n', '-t', plan, '-l', jtl, '-e', '-o', dashboard, '-Jhost=127.0.0.1', `-Jport=${port}`];
    const jmeter = child(command, args, env, path.join(output, 'jmeter.log'));
    exitCode = (await jmeter.completion).code;
    if (exitCode !== 0) note = `JMeter terminó con código ${exitCode}; revisar jmeter.log`;
  } catch (error) {
    note = error.message;
  } finally {
    if (server?.processHandle.exitCode === null) {
      server.processHandle.kill();
      await server.completion;
    }
    try {
      if (!database.startsWith('distrito_cosmetico_jmeter_')) throw new Error('Nombre de base inseguro');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      if (mongoose.connection.name !== database) throw new Error('La conexión no apunta a la base temporal');
      await mongoose.connection.dropDatabase();
      fs.writeFileSync(path.join(output, 'cleanup.txt'), `Base temporal eliminada: ${database}\n`);
    } catch (error) {
      note += `; no se pudo eliminar la base temporal ${database}: ${error.message}`;
    } finally { await mongoose.disconnect().catch(() => {}); }
    const summary = summarize(exitCode, note);
    console.log(`Resultados: ${output}`);
    console.log(`Muestras: ${summary.rows.length}; fallos inesperados: ${summary.failed.length}; pasos funcionales: ${summary.functional.length}; rechazos esperados: ${summary.expectedErrors.length}`);
    if (note) console.error(note);
    if (exitCode !== 0 || summary.failed.length || summary.functional.length !== 26 || summary.expectedErrors.length !== 2) process.exitCode = 1;
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
