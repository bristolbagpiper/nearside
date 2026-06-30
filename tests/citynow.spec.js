import { expect, test } from "@playwright/test";

test("core CityNow interactions work", async ({ page }) => {
  await page.goto("/today");

  await page.getByRole("button", { name: /Roads Slow in places/i }).click();
  await expect(page.getByRole("heading", { name: "Roads now" })).toBeVisible();

  await page.getByRole("button", { name: /Buses are moving/i }).click();
  await expect(page.getByText("Last updated 4 min ago", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Public transport Minor delays/i }).click();

  await page.getByRole("tab", { name: "Trains" }).click();
  await expect(page.getByText("Bath Spa")).toBeVisible();

  await page.getByRole("button", { name: "View forecast" }).click();
  await expect(page).toHaveURL(/\/weather$/);

  await page.getByRole("button", { name: "Explore" }).click();
  await page.getByRole("button", { name: /Open Bristol International Balloon Fiesta/i }).click();
  await expect(page.locator(".detail-drawer").getByRole("heading", { name: "Bristol International Balloon Fiesta" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".detail-drawer")).toHaveCount(0);

  await page.getByRole("button", { name: /Save Bristol International Balloon Fiesta/i }).click();
  await page.getByRole("button", { name: "Saved" }).click();
  await expect(page.getByText("Bristol International Balloon Fiesta")).toBeVisible();

  await page.getByRole("button", { name: /Bristol, UK/i }).click();
  await page.getByRole("button", { name: /Bath Compact city centre/i }).click();
  await expect(page.getByRole("button", { name: /Bath, UK/i })).toBeVisible();
});
