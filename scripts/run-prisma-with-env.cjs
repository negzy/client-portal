#!/usr/bin/env node
/**
 * Runs `prisma <args>` with DATABASE_URL_UNPOOLED filled when missing.
 * Usage: node scripts/run-prisma-with-env.cjs db push
 */
const path = require("path");
const { execSync } = require("child_process");

process.chdir(path.join(__dirname, ".."));
require("./ensure-prisma-db-env.cjs");

const args = process.argv.slice(2).join(" ");
if (!args) {
  console.error("Usage: node scripts/run-prisma-with-env.cjs <prisma-args>");
  process.exit(1);
}
execSync(`npx prisma ${args}`, { stdio: "inherit", env: process.env });
