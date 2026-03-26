/**
 * Run before `prisma generate` / `prisma db push` so `DATABASE_URL_UNPOOLED`
 * exists when only `DATABASE_URL` is in `.env`.
 *
 * Prisma CLI loads `.env` inside its own process, but our `execSync` path needs
 * `DATABASE_URL` visible in the parent to copy → UNPOOLED before spawn, OR we
 * preload `.env` here (same as what Prisma would read).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

/**
 * Minimal .env loader: KEY=value lines, no override if process.env[key] already set.
 */
function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key || key.startsWith("#")) continue;
    if (process.env[key] !== undefined) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function run() {
  loadDotEnvFile(path.join(root, ".env"));
  loadDotEnvFile(path.join(root, ".env.local"));

  if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  }
  if (!process.env.DATABASE_URL_UNPOOLED) {
    if (process.env.POSTGRES_URL_NON_POOLING) {
      process.env.DATABASE_URL_UNPOOLED = process.env.POSTGRES_URL_NON_POOLING;
    } else if (process.env.DIRECT_URL) {
      process.env.DATABASE_URL_UNPOOLED = process.env.DIRECT_URL;
    } else if (process.env.DATABASE_URL) {
      process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
    }
  }
}

run();
