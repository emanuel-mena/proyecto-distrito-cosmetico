const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'jmeter', 'rendimiento-insumos.csv');
const output = path.join(root, 'jmeter', 'rendimiento-insumos.local.csv');
const expectedHeader = 'correo,password,searchTerm';

if (!fs.existsSync(source)) throw new Error(`No existe la plantilla: ${source}`);

if (fs.existsSync(output)) {
  const firstLine = fs.readFileSync(output, 'utf8').split(/\r?\n/, 1)[0].replace(/^\uFEFF/, '');
  if (firstLine !== expectedHeader) throw new Error(`El CSV existente tiene columnas distintas de ${expectedHeader}: ${output}`);
  console.log(`CSV existente conservado: ${output}`);
} else {
  fs.copyFileSync(source, output, fs.constants.COPYFILE_EXCL);
  console.log(`CSV creado: ${output}`);
}

console.log('Complete el correo y la contraseña con credenciales válidas antes de ejecutar JMeter manualmente.');
