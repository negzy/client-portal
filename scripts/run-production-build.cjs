#!/usr/bin/env node
/**
 * Ensures DATABASE_URL_UNPOOLED is set (same process.env as child processes),
 * then runs prisma generate + next build. Required because `a && b` drops env
 * mutations from a separate Node process.
 */
const path = require("path");
const { execSync } = require("child_process");

process.chdir(path.join(__dirname, ".."));
require("./ensure-prisma-db-env.cjs");

execSync("npx prisma generate", { stdio: "inherit", env: process.env });
execSync("npx next build", { stdio: "inherit", env: process.env });
