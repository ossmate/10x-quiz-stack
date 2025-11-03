/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type Page, type BrowserContext } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

/**
 * Authentication Helper
 * Provides reusable authentication functions for E2E tests
 * Uses test user credentials from .env.test
 */

/**
 * Test user credentials from .env.test
 */
export const TEST_USER = {
  email: process.env.E2E_USERNAME!,
  password: process.env.E2E_PASSWORD!,
};

/**
 * Validate that test credentials are available
 */
export function validateTestCredentials() {
  if (!TEST_USER.email || !TEST_USER.password) {
    throw new Error(
      "E2E test credentials not found in .env.test. Please ensure E2E_USERNAME and E2E_PASSWORD are set."
    );
  }
}

/**
 * Login as test user
 * Returns true if login was successful
 */
export async function loginAsTestUser(page: Page): Promise<boolean> {
  validateTestCredentials();

  const loginPage = new LoginPage(page);

  // Go to login page
  await loginPage.goto();

  // Login with test credentials
  await loginPage.login(TEST_USER.email, TEST_USER.password);

  // Wait for redirect to dashboard
  try {
    await loginPage.waitForSuccessRedirect();
    return true;
  } catch {
    return false;
  }
}

/**
 * Setup authenticated session for test user
 * This can be used in beforeEach hooks to avoid repeated logins
 */
export async function setupAuthenticatedSession(page: Page) {
  await loginAsTestUser(page);
  // Wait for page to be fully loaded
  await page.waitForLoadState("networkidle");
}

/**
 * Check if user is authenticated by trying to access protected route
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto("/quizzes/ai/generate");
  await page.waitForLoadState("networkidle");

  // If on login page, user is not authenticated
  return !page.url().includes("/auth/login");
}

/**
 * Logout by navigating to logout page which handles server-side logout
 */
export async function logout(page: Page) {
  await page.goto("/auth/logout");
  await page.waitForLoadState("networkidle");
  // After logout, should redirect to home page
  await page.waitForURL("/", { timeout: 5000 });
}

/**
 * Save authenticated state to storage
 * Can be used to restore authentication in other tests without logging in again
 */
export async function saveAuthState(context: BrowserContext, path = ".auth/user.json") {
  await context.storageState({ path });
}

/**
 * Load authenticated state from storage
 * Use in playwright.config.ts projects for faster test execution
 */
export async function loadAuthState(context: BrowserContext, path = ".auth/user.json") {
  // This is typically done in playwright.config.ts, not here
  // But provided for reference
  return path;
}
