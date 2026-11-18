// Publica o build em uma conta Cloudflare própria, fora do Sites.
// Uso, depois de `npm run build` e `npx wrangler login`:
//   node scripts/deploy-cloudflare.mjs            aplica migrações pendentes e publica
//   node scripts/deploy-cloudflare.mjs --dry-run  só valida o pacote
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const target = JSON.parse(readFileSync(new URL("../cloudflare.json", import.meta.url), "utf8"));
const generated = new URL("../dist/server/wrangler.json", import.meta.url);
const production = new URL("../dist/server/wrangler.production.json", import.meta.url);
const dryRun = process.argv.includes("--dry-run");

const config = JSON.parse(readFileSync(generated, "utf8"));
if (!target.d1.database_id || target.d1.database_id.startsWith("00000000")) {
  throw new Error("Defina o database_id real do D1 em cloudflare.json.");
}
config.name = target.worker;
config.topLevelName = target.worker;
config.workers_dev = true;
config.d1_databases = [{ binding: "DB", database_name: target.d1.database_name, database_id: target.d1.database_id,
  migrations_dir: "../../drizzle" }];
writeFileSync(production, JSON.stringify(config, null, 2));

const wrangler = ["./node_modules/wrangler/bin/wrangler.js"];
function run(args) {
  const result = spawnSync(process.execPath, [...wrangler, ...args], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const configPath = "dist/server/wrangler.production.json";
if (dryRun) {
  run(["deploy", "--config", configPath, "--dry-run"]);
} else {
  // Migrações são aditivas e registradas pelo Wrangler em d1_migrations; reaplicar é seguro.
  run(["d1", "migrations", "apply", target.d1.database_name, "--remote", "--config", configPath]);
  run(["deploy", "--config", configPath]);
}
