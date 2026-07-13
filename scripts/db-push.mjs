// Aplica TODAS as migrações de supabase/migrations (em ordem) no banco.
// Uso: npm run db:push  (usa DATABASE_URL do .env.local)
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL no .env.local.");
  process.exit(1);
}

const dir = resolve(__dirname, "..", "supabase", "migrations");
const arquivos = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`→ Conectado. ${arquivos.length} migração(ões) para aplicar…`);
  for (const arquivo of arquivos) {
    const sql = readFileSync(resolve(dir, arquivo), "utf8");
    process.stdout.write(`  · ${arquivo} … `);
    await client.query(sql); // protocolo simples: múltiplos statements ok
    console.log("ok");
  }
  console.log("✓ Todas as migrações aplicadas.");
} catch (e) {
  console.error("\n✗ Erro:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
