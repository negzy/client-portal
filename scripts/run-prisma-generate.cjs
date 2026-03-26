#!/usr/bin/env node
const path = require("path");
const { execSync } = require("child_process");

process.chdir(path.join(__dirname, ".."));
require("./ensure-prisma-db-env.cjs");

execSync("npx prisma generate", { stdio: "inherit", env: process.env });
