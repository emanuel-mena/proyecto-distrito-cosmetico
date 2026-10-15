const fs = require('node:fs');
const path = require('node:path');

// JMeter reserializa los planes al guardarlos: ajusta tipos, orden de propiedades
// e identificadores internos. Mantener su exportación como plantilla evita que
// abrir y guardar el plan produzca cambios de formato en Git.
const template = path.join(__dirname, 'templates', 'distrito-cosmetico-rendimiento.jmx');
const output = path.resolve(__dirname, '../jmeter/distrito-cosmetico-rendimiento.jmx');

fs.copyFileSync(template, output);
console.log(output);
