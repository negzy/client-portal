/**
 * Prisma parses Postgres URLs strictly: unknown query params throw
 * "The provided arguments are not supported in database URL".
 * Supabase (and some hosts) append `options=-c ...` or `channel_binding=...`;
 * strip those before Prisma reads the env (see prisma.ts).
 *
 * Also normalizes env names: Vercel Neon marketplace may expose POSTGRES_* URLs;
 * Prisma schema uses DATABASE_URL + DATABASE_URL_UNPOOLED (Neon native integration).
 */
const UNSUPPORTED_PG_URL_PARAMS = new Set([
  "options",
  "channel_binding",
]);

function stripCurlyQuotes(s: string): string {
  return s.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
}

function sanitizeConnectionString(raw: string): string {
  let url = stripCurlyQuotes(raw).trim();

  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }

  const q = url.indexOf("?");
  if (q === -1) return url;

  const base = url.slice(0, q);
  const query = url.slice(q + 1);
  const parts = query.split("&").filter(Boolean);
  const kept = parts.filter((p) => {
    const eq = p.indexOf("=");
    const name = (eq === -1 ? p : p.slice(0, eq)).trim();
    if (!name) return false;
    let key: string;
    try {
      key = decodeURIComponent(name).toLowerCase();
    } catch {
      key = name.toLowerCase();
    }
    return !UNSUPPORTED_PG_URL_PARAMS.has(key);
  });

  return kept.length > 0 ? `${base}?${kept.join("&")}` : base;
}

function sanitizeEnvKey(key: "DATABASE_URL" | "DATABASE_URL_UNPOOLED"): void {
  const raw = process.env[key];
  if (typeof raw !== "string" || raw.length === 0) return;
  const next = sanitizeConnectionString(raw);
  if (next !== raw.trim()) process.env[key] = next;
}

/**
 * Mutates `process.env` so Prisma can connect. Call before `new PrismaClient()`.
 */
export function sanitizeDatabaseUrlEnv(): void {
  // Legacy / template names (Vercel Postgres examples, some CLI pulls)
  if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  }
  if (!process.env.DATABASE_URL_UNPOOLED) {
    if (process.env.POSTGRES_URL_NON_POOLING) {
      process.env.DATABASE_URL_UNPOOLED = process.env.POSTGRES_URL_NON_POOLING;
    } else if (process.env.DIRECT_URL) {
      process.env.DATABASE_URL_UNPOOLED = process.env.DIRECT_URL;
    }
  }

  sanitizeEnvKey("DATABASE_URL");
  sanitizeEnvKey("DATABASE_URL_UNPOOLED");

  // Local dev or hosts that only ship one URL: Prisma still needs directUrl at generate time.
  if (
    process.env.DATABASE_URL &&
    (!process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED.length === 0)
  ) {
    process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
  }
}
