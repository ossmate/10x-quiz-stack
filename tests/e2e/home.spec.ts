import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test.describe("Home Page", () => {
  test("should display the welcome page", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.welcomeHeading).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.clickLogin();
    await expect(page).toHaveURL(/.*auth\/login/);
  });

  test("should navigate to register page", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.clickRegister();
    await expect(page).toHaveURL(/.*auth\/register/);
  });
});
