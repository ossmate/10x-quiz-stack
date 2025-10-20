import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

/**
 * Home Page Tests
 * The homepage is publicly accessible and shows the dashboard with quiz tabs
 */
test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies to test as unauthenticated user
    await page.context().clearCookies();
  });

  test("should display the public dashboard", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Should show dashboard heading
    await expect(homePage.dashboardHeading).toBeVisible();

    // Should show both quiz tabs (public dashboard accessible to all)
    await expect(homePage.myQuizzesTab).toBeVisible();
    await expect(homePage.publicQuizzesTab).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.clickLogin();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should navigate to register page", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.clickRegister();
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});
