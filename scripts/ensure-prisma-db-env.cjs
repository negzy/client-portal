/**
 * Run before `prisma generate` so `DATABASE_URL_UNPOOLED` exists when only
 * `DATABASE_URL` is set (local dev). Also maps legacy POSTGRES_* names.
 * Does not load dotenv — Next/Vercel/Prisma already load `.env`.
 */
function run() {
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
