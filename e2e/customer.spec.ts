import { test, expect } from "@playwright/test";

const CLIENT_EMAIL = "client@creditlyft.local";
const CLIENT_PASSWORD = "client123";

async function loginAsClient(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder("you@example.com").fill(CLIENT_EMAIL);
  await page.getByPlaceholder("••••••••").fill(CLIENT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("Customer (client) flows", () => {
  test("login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /creditlyft portal/i })).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder("you@example.com").fill(CLIENT_EMAIL);
    await page.getByPlaceholder("••••••••").fill(CLIENT_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("dashboard shows welcome and main links", async ({ page }) => {
    await loginAsClient(page);
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /import (credit )?report/i }).first()).toBeVisible();
  });

  test("credit import page loads and shows upload", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/dashboard/credit-import");
    await expect(page.getByRole("heading", { name: /import your credit report/i })).toBeVisible();
    await expect(page.getByText(/upload|manual upload/i)).toBeVisible();
  });

  test("vault page loads with upload and document list", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/dashboard/vault");
    await expect(page.getByRole("heading", { name: /document vault/i })).toBeVisible();
    await expect(page.getByText(/upload document/i)).toBeVisible();
    await expect(page.getByText(/your documents/i)).toBeVisible();
  });

  test("tasks page loads", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/dashboard/tasks");
    await expect(page.getByRole("heading", { name: /^tasks$/i })).toBeVisible();
  });

  test("register then auto sign-in lands on dashboard", async ({ page }) => {
    const unique = Date.now();
    const email = `e2e-${unique}@test.local`;
    await page.goto("/register");
    await expect(page.getByLabel(/full name/i)).toBeVisible({ timeout: 10000 });
    await page.getByLabel(/full name/i).fill("E2E Test User");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/password/i).fill("password1234");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });
});
