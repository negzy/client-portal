/**
 * Prisma parses `DATABASE_URL` strictly: unknown query params throw
 * "The provided arguments are not supported in database URL".
 * Supabase (and some hosts) append `options=-c ...` or `channel_binding=...`;
 * strip those before Prisma reads the env (see prisma.ts).
 */
const UNSUPPORTED_PG_URL_PARAMS = new Set([
  "options",
  "channel_binding",
]);

function stripCurlyQuotes(s: string): string {
  return s.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
}

/**
 * Mutates `process.env.DATABASE_URL` when fixes apply (Vercel / runtime only).
 */
export function sanitizeDatabaseUrlEnv(): void {
  const raw = process.env.DATABASE_URL;
  if (typeof raw !== "string" || raw.length === 0) return;

  let url = stripCurlyQuotes(raw).trim();

  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }

  const q = url.indexOf("?");
  if (q === -1) {
    if (url !== raw) process.env.DATABASE_URL = url;
    return;
  }

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

  const next = kept.length > 0 ? `${base}?${kept.join("&")}` : base;
  if (next !== raw.trim()) {
    process.env.DATABASE_URL = next;
  }
}
