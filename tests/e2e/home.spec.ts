import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";
import { loginAsTestUser } from "./helpers/auth.helper";

/**
 * Home Page Tests
 * The homepage is publicly accessible and shows a marketing/landing page with features and demo quizzes
 */
test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies to test as unauthenticated user
    await page.context().clearCookies();
  });

  test("should display the public landing page for unauthenticated users", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Should show hero heading
    await expect(homePage.heroHeading).toBeVisible();

    // Should show features section
    await expect(homePage.featuresSection).toBeVisible();

    // Should show demo quizzes section
    await expect(homePage.demoQuizzesSection).toBeVisible();

    // Should show auth buttons for unauthenticated users
    await expect(homePage.getStartedButton).toBeVisible();
    await expect(homePage.loginButton).toBeVisible();
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

  test("should show dashboard button for authenticated users", async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    const homePage = new HomePage(page);
    await homePage.goto();

    // Should show dashboard button for authenticated users
    await expect(homePage.dashboardButton).toBeVisible();

    // Should NOT show get started button
    await expect(homePage.getStartedButton).not.toBeVisible();
  });
});
