const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const backendRoot = path.resolve(__dirname, "..");
const frontendRoot = path.resolve(
  backendRoot,
  "../distrito-cosmetico-frontend",
);
const frontendPackage = path.join(frontendRoot, "package.json");
const frontendDist = path.join(frontendRoot, "dist");
const publicDir = path.join(backendRoot, "public");
const npmCli =
  process.env.npm_execpath ||
  path.resolve(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");

if (!fs.existsSync(frontendPackage)) {
  throw new Error(
    "No se encontró el frontend. Inicialice el submódulo Git antes de construir.",
  );
}

const run = (args) => {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd: frontendRoot,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

run(["ci"]);
run(["run", "build"]);

fs.rmSync(publicDir, { recursive: true, force: true });
fs.cpSync(frontendDist, publicDir, { recursive: true });
console.log(`Frontend copiado a ${publicDir}`);
