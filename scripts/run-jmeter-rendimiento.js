require('dotenv').config({ quiet: true });

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const root = path.resolve(__dirname, '..');
const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, '')}_${randomBytes(4).toString('hex')}`;
const database = `dc_perf_${randomBytes(8).toString('hex')}`;
const output = path.join(root, 'reports', 'jmeter', `rendimiento_${runId}`);
const plan = path.join(root, 'test', 'jmeter', 'distrito-cosmetico-rendimiento.jmx');
const csvFile = path.join(output, 'insumos-temporales.csv');
const jtl = path.join(output, 'results.jtl');
const dashboard = path.join(output, 'dashboard');
const jmeterHome = process.env.JMETER_HOME || path.resolve(root, '../apache-jmeter-5.6.3/apache-jmeter-5.6.3');
const jmeterBin = path.join(jmeterHome, 'bin', process.platform === 'win32' ? 'jmeter.bat' : 'jmeter');
const java21 = 'C:\\Program Files\\Java\\jdk-21';

function configuredThreads() {
  const match = fs.readFileSync(plan, 'utf8').match(/<elementProp name="loadThreads"[^>]*>[\s\S]*?<stringProp name="Argument\.value">(\d+)<\/stringProp>/);
  const count = Number(match?.[1]);
  if (!Number.isSafeInteger(count) || count < 1 || count > 20) throw new Error('loadThreads debe estar entre 1 y 20 (límite de login de la API)');
  return count;
}

function isolatedUri() {
  if (!process.env.MONGODB_URI) throw new Error('Configure MONGODB_URI en .env');
  const uri = new URL(process.env.MONGODB_URI);
  if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol)) throw new Error('MONGODB_URI inválido');
  const originalDb = uri.pathname.replace(/^\//, '') || 'admin';
  uri.searchParams.set('authSource', uri.searchParams.get('authSource') || originalDb);
  uri.pathname = `/${database}`;
  return uri.toString();
}

function freePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port;
      socket.close(() => resolve(port));
    });
  });
}

function child(command, args, env, logFile) {
  const stream = fs.createWriteStream(logFile);
  const proc = spawn(command, args, { cwd: root, env, windowsHide: true });
  proc.stdout.pipe(stream);
  proc.stderr.pipe(stream);
  const completion = new Promise((resolve, reject) => {
    proc.once('error', reject);
    proc.once('exit', (code) => resolve(code));
  }).finally(() => stream.end());
  return { proc, completion };
}

async function waitForHealth(port, server) {
  for (let i = 0; i < 80; i++) {
    if (server.proc.exitCode !== null) throw new Error('La API terminó antes de responder');
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* wait for startup */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('La API no respondió en 20 segundos');
}

function parseCsv(content) {
  const rows = [];
  let record = [], field = '', quoted = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (quoted && content[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { record.push(field); field = ''; }
    else if ((ch === '\r' || ch === '\n') && !quoted) {
      if (ch === '\r' && content[i + 1] === '\n') i++;
      record.push(field);
      if (record.some(Boolean)) rows.push(record);
      record = []; field = '';
    } else field += ch;
  }
  if (field || record.length) { record.push(field); rows.push(record); }
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((key, i) => [key, values[i] || ''])));
}

function percentile(values, percentage) {
  if (!values.length) return 0;
  return values[Math.ceil(values.length * percentage / 100) - 1];
}

function report(code, note) {
  const rows = fs.existsSync(jtl) ? parseCsv(fs.readFileSync(jtl, 'utf8')) : [];
  const services = ['S01 POST /api/auth/login', 'S02 GET /api/categories', 'S03 GET /api/products?search', 'S04 GET /api/cart', 'S05 GET /api/orders'];
  const byService = services.map((label) => {
    const samples = rows.filter((r) => r.label === label);
    const elapsed = samples.map((r) => Number(r.elapsed)).filter(Number.isFinite).sort((a, b) => a - b);
    const stamps = samples.map((r) => Number(r.timeStamp)).filter(Number.isFinite);
    const span = stamps.length > 1 ? Math.max(1, (Math.max(...stamps) - Math.min(...stamps)) / 1000) : 1;
    return { label, samples, elapsed, p95: percentile(elapsed, 95), rps: samples.length / span, failures: samples.filter((r) => r.success !== 'true').length };
  });
  const lines = ['# Resultados de rendimiento', '', `- Corrida: ${runId}`, `- JMeter: ${code === 0 ? 'completado' : `falló (${code})`}`, `- Muestras: ${rows.length}`, `- Fallos: ${rows.filter((r) => r.success !== 'true').length}`, '- Dashboard: [abrir](dashboard/index.html)', '', '| Servicio | Muestras | Fallos | p50 ms | p95 ms | p99 ms | solicitudes/s |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
  for (const { label, samples, elapsed, p95, rps, failures } of byService) {
    lines.push(`| ${label} | ${samples.length} | ${failures} | ${percentile(elapsed, 50)} | ${p95} | ${percentile(elapsed, 99)} | ${rps.toFixed(2)} |`);
  }
  lines.push('', '## Análisis y conclusiones', '');
  if (note) lines.push(`- Ejecución: ${note}`);
  if (!rows.length) lines.push('- No se recopilaron muestras; no es posible concluir sobre el rendimiento.');
  else {
    const failures = rows.filter((r) => r.success !== 'true');
    lines.push(`- Tasa de error global: ${(100 * failures.length / rows.length).toFixed(2)} %. ${failures.length ? 'Hay fallos que deben investigarse antes de aceptar el rendimiento.' : 'No se observaron errores HTTP ni fallos de validación.'}`);
    for (const { label, samples } of byService) if (!samples.length) lines.push(`- ${label}: sin muestras; cobertura incompleta.`);
    const slowest = byService.filter(({ samples }) => samples.length).sort((a, b) => b.p95 - a.p95)[0];
    if (slowest) lines.push(`- La mayor latencia p95 fue ${slowest.label} (${slowest.p95} ms); es el primer servicio a revisar si el objetivo de latencia no se cumple.`);
    lines.push(`- El login se ejecuta una vez por usuario virtual; sus ${byService[0].samples.length} muestras no son comparables en volumen con las rutas repetidas.`);
    lines.push('- Compare estos valores con el objetivo de latencia y error acordado para el proyecto; la consigna no define umbrales de aceptación.');
    for (const row of failures.slice(0, 10)) lines.push(`- Fallo ${row.label}: HTTP ${row.responseCode}; ${String(row.failureMessage || row.responseMessage || 'sin detalle').replace(/[\r\n]+/g, ' ').slice(0, 180)}`);
  }
  fs.writeFileSync(path.join(output, 'analysis.md'), lines.join('\n') + '\n');
  return { rows, failures: rows.filter((r) => r.success !== 'true'), labels: new Set(rows.map((r) => r.label)) };
}

async function main() {
  if (!fs.existsSync(plan)) throw new Error('Genere el plan con npm run jmeter:rendimiento:generate');
  if (!fs.existsSync(jmeterBin)) throw new Error(`JMeter no encontrado: ${jmeterBin}`);
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) throw new Error('Configure ADMIN_EMAIL y ADMIN_PASSWORD en .env para el seed');
  const threads = configuredThreads();
  const uri = isolatedUri();
  const port = await freePort();
  const env = { ...process.env, MONGODB_URI: uri, PORT: String(port) };
  const javaHome = process.env.JMETER_JAVA_HOME || (fs.existsSync(path.join(java21, 'bin', 'java.exe')) ? java21 : process.env.JAVA_HOME);
  if (javaHome) { env.JAVA_HOME = javaHome; env.Path = `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.Path || process.env.PATH || ''}`; }
  fs.mkdirSync(output, { recursive: true });
  let server, code = -1, note = '';
  try {
    if ((await child(process.execPath, ['src/seed/seed.js'], env, path.join(output, 'seed.log')).completion) !== 0) throw new Error('El seed falló; revisar seed.log');
    const password = randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);
    const users = Array.from({ length: threads }, (_, i) => ({
      nombre: `Cliente Rendimiento ${i + 1}`,
      correo: `rendimiento_${runId.toLowerCase()}_${i + 1}@example.test`,
      password: passwordHash,
      rol: 'cliente',
    }));
    await mongoose.connect(uri);
    await User.insertMany(users);
    await mongoose.disconnect();
    const terms = ['Maquillaje', 'Sérum', 'Labial', 'Crema', 'Shampoo', 'Perfume'];
    fs.writeFileSync(csvFile, 'correo,password,searchTerm\n' + users.map((user, i) => `${user.correo},${password},${terms[i % terms.length]}`).join('\n') + '\n');
    server = child(process.execPath, ['src/server.js'], env, path.join(output, 'api.log'));
    await waitForHealth(port, server);
    env.JMETER_BAT = jmeterBin;
    env.JMETER_PLAN = plan;
    env.JMETER_JTL = jtl;
    env.JMETER_REPORT = dashboard;
    env.JMETER_PORT = String(port);
    env.JMETER_CSV = csvFile.replace(/\\/g, '/');
    const command = process.platform === 'win32' ? 'powershell.exe' : jmeterBin;
    const args = process.platform === 'win32'
      ? ['-NoProfile', '-NonInteractive', '-Command', '& $env:JMETER_BAT -n -t $env:JMETER_PLAN -l $env:JMETER_JTL -e -o $env:JMETER_REPORT "-Jhost=127.0.0.1" "-Jport=$env:JMETER_PORT" "-JcsvFile=$env:JMETER_CSV"']
      : ['-n', '-t', plan, '-l', jtl, '-e', '-o', dashboard, '-Jhost=127.0.0.1', `-Jport=${port}`, `-JcsvFile=${env.JMETER_CSV}`];
    code = await child(command, args, env, path.join(output, 'jmeter.log')).completion;
    if (code !== 0) note = 'JMeter terminó con error; revisar jmeter.log';
  } catch (error) { note = error.message; }
  finally {
    if (server?.proc.exitCode === null) { server.proc.kill(); await server.completion; }
    if (fs.existsSync(csvFile)) fs.unlinkSync(csvFile);
    try {
      if (!/^dc_perf_[0-9a-f]{16}$/.test(database)) throw new Error('Nombre de base inseguro');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      if (mongoose.connection.name !== database) throw new Error('La conexión no apunta a la base temporal');
      await mongoose.connection.dropDatabase();
      fs.writeFileSync(path.join(output, 'cleanup.txt'), `Base temporal eliminada: ${database}\n`);
    } catch (error) { note += `; limpieza: ${error.message}`; }
    finally { await mongoose.disconnect().catch(() => {}); }
    const result = report(code, note);
    console.log(`Resultados: ${output}`);
    console.log(`Muestras: ${result.rows.length}; fallos: ${result.failures.length}`);
    if (note) console.error(note);
    if (code !== 0 || result.failures.length || result.labels.size !== 5) process.exitCode = 1;
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
