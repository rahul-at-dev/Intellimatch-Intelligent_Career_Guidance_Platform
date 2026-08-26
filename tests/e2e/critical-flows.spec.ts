import { test, expect } from "@playwright/test";

// Critical end-to-end flows for IntelliMatch AI.
// Requires the web app (localhost:3000) and API (localhost:8000) running.

test("landing page loads and links to onboarding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Understand your potential/i })).toBeVisible();
  await page.getByRole("link", { name: /Analyze My Resume/i }).click();
  await expect(page).toHaveURL(/onboarding/);
});

test("dashboard shows career match data", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText(/Career Match Score/i)).toBeVisible();
  await expect(page.getByText(/Recommended Jobs/i)).toBeVisible();
});

test("jobs page search and navigate to match", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByPlaceholder(/Search title, company/i).fill("Backend");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Backend Engineer/i).first()).toBeVisible();
});

test("career simulator runs a simulation", async ({ page }) => {
  await page.goto("/career-simulator");
  await page.getByRole("button", { name: "AWS" }).click();
  await page.getByRole("button", { name: /Simulate/i }).click();
  await expect(page.getByText(/Career Paths Unlocked/i)).toBeVisible();
});

test("ai assistant responds to a suggested question", async ({ page }) => {
  await page.goto("/ai-assistant");
  await page.getByRole("button", { name: /What should I learn next/i }).click();
  await expect(page.getByText(/highest estimated ROI/i)).toBeVisible();
});

test("recruiter search parses a natural language query", async ({ page }) => {
  await page.goto("/recruiter/search");
  await page.getByRole("button", { name: /Search Candidates/i }).click();
  await expect(page.getByText(/Parsed Filters/i)).toBeVisible();
});
