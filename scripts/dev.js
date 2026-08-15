const { spawn } = require("child_process");
const path = require("path");

const frontendRoot = path.resolve(
  "distrito-cosmetico-frontend",
);
const npmCli =
  process.env.npm_execpath ||
  path.resolve(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
const children = [
  spawn(process.execPath, [npmCli, "run", "dev:api"], { cwd: backendRoot, stdio: "inherit" }),
  spawn(process.execPath, [npmCli, "run", "dev"], { cwd: frontendRoot, stdio: "inherit" }),
];

let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exit(code);
};

for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping && (code !== 0 || signal)) stop(code || 1);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
