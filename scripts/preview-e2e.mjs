import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const port = process.argv[2] || "18790";
const wrangler = ["--import", "./scripts/sites-env.mjs", "./node_modules/wrangler/bin/wrangler.js"];
const config = ["--local", "--config", "dist/server/wrangler.json"];
mkdirSync(".wrangler", { recursive: true });
const state = mkdtempSync(resolve(".wrangler/e2e-"));
const local = [...config, "--persist-to", state];

for (const migration of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) {
  const command = [...wrangler, "d1", "execute", "DB", ...local, "--file", "drizzle/" + migration];
  const applied = spawnSync(process.execPath, command, { stdio: "inherit" });
  if (applied.status !== 0) process.exit(applied.status ?? 1);
}

const server = spawn(process.execPath, [
  ...wrangler, "dev", ...local, "--ip", "127.0.0.1", "--port", port, "--inspector-port", "0",
], { stdio: "inherit" });
server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
server.on("exit", (code) => { process.exitCode = code ?? 0; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill());
