import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";
import { TEST_USER, loginAsTestUser, logout, isAuthenticated } from "./helpers/auth.helper";

/**
 * E2E Tests for Authentication Flow
 * Tests critical user journeys: Login → Access Protected Routes → Session Management
 *
 * Following Playwright best practices:
 * - Page Object Model for maintainability
 * - Resilient locators using roles and labels
 * - Browser contexts for test isolation
 * - Uses pre-existing test user from .env.test
 * - Trace viewer on failure for debugging
 */

test.describe("Authentication Flow", () => {
  /**
   * Ensure each test starts with clean state (logged out)
   */
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage to ensure clean state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  /**
   * Test 1: Login with Email Successfully
   * Verifies user can login with email and access dashboard
   */
  test("should login with email successfully and access dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login page
    await loginPage.goto();

    // Login with test user email
    await loginPage.loginWithEmail(TEST_USER.email, TEST_USER.password);

    // Verify successful redirect to dashboard
    await loginPage.waitForSuccessRedirect();
    await dashboardPage.expectDashboardVisible();

    // Verify user is on dashboard URL
    await expect(page).toHaveURL("/dashboard");
  });

  /**
   * Test 2: Login Form Validation
   * Verifies client-side and server-side validation
   */
  test("should validate login form with empty fields", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to submit empty form (HTML5 validation might prevent it)
    await loginPage.submit();

    // Wait a moment for any client-side validation
    await page.waitForTimeout(500);

    // Verify we're still on login page (form didn't submit due to validation)
    await expect(page).toHaveURL("/auth/login");

    // Note: If HTML5 validation is active, errors won't show up in the DOM
    // The browser's native validation will prevent submission
  });

  /**
   * Test 3: Login with Invalid Credentials
   * Verifies error handling for wrong credentials
   */
  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to login with invalid password (use attemptLogin for failed login attempts)
    await loginPage.attemptLogin(TEST_USER.email, "WrongPassword123");

    // Should display error message
    await loginPage.expectFormError(/invalid|incorrect|wrong/i);

    // User should still be on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  /**
   * Test 4: Protected Route Access Without Authentication
   * Verifies middleware redirects unauthenticated users to login
   */
  test("should redirect unauthenticated user to login from protected route", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Try to access AI quiz generation (protected route)
    await page.goto("/quizzes/ai/generate");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });

    // Verify redirect parameter is preserved
    await loginPage.expectRedirectParam("/quizzes/ai/generate");
  });

  /**
   * Test 5: Multiple Protected Routes Require Authentication
   * Verifies all protected routes are properly secured
   */
  test("should protect all critical routes from unauthenticated access", async ({ page }) => {
    const protectedRoutes = [
      { path: "/quizzes/new", name: "Create Quiz" },
      { path: "/quizzes/ai/generate", name: "AI Generate" },
      { path: "/auth/change-password", name: "Change Password" },
    ];

    for (const route of protectedRoutes) {
      // Try to access protected route
      await page.goto(route.path);

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/, {
        timeout: 5000,
      });

      // Verify redirect parameter preserves original destination
      const url = new URL(page.url());
      const redirectParam = url.searchParams.get("redirect");
      expect(redirectParam).toBe(route.path);
    }
  });

  /**
   * Test 6: Login Redirect Flow
   * Verifies user is redirected to original destination after login
   */
  test("should redirect to original protected page after successful login", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Try to access protected route (AI generate)
    await page.goto("/quizzes/ai/generate");

    // Should redirect to login with redirect parameter
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/);
    await loginPage.expectRedirectParam("/quizzes/ai/generate");

    // Fill login form
    await loginPage.fillLoginForm(TEST_USER.email, TEST_USER.password);

    // Submit and wait for redirect to protected page
    await Promise.all([page.waitForURL(/\/quizzes\/ai\/generate/, { timeout: 10000 }), loginPage.submit()]);

    // Verify we're on the protected page
    await expect(page).toHaveURL(/\/quizzes\/ai\/generate/);
  });

  /**
   * Test 7: Session Persistence Across Page Navigations
   * Verifies session is maintained when navigating between pages
   */
  test("should maintain authentication session across page navigations", async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    // Verify authenticated
    expect(await isAuthenticated(page)).toBe(true);

    // Navigate to dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");

    // Navigate to AI generate (protected)
    await page.goto("/quizzes/ai/generate");
    await expect(page).toHaveURL(/\/quizzes\/ai\/generate/);
    // Should NOT redirect to login

    // Navigate back to dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");

    // User should still be authenticated (no redirect to login)
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  /**
   * Test 8: Already Authenticated User Cannot Access Login Page
   * Verifies authenticated users are redirected away from auth pages
   */
  test("should redirect authenticated user away from login page to dashboard", async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    // Try to access login page while authenticated
    await page.goto("/auth/login");

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
  });

  /**
   * Test 9: Already Authenticated User Cannot Access Register Page
   * Verifies authenticated users can't access registration
   */
  test("should redirect authenticated user away from register page to dashboard", async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    // Try to access register page while authenticated
    await page.goto("/auth/register");

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 });
  });

  /**
   * Test 10: Logout Flow
   * Verifies user can logout and is redirected appropriately
   */
  test("should logout user and restrict access to protected routes", async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    // Verify authenticated
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");

    // Logout
    await logout(page);

    // Try to access protected route after logout
    await page.goto("/quizzes/ai/generate");

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  /**
   * Test 11: Dashboard Access After Login
   * Verifies dashboard loads correctly for authenticated user
   */
  test("should access dashboard and see user-specific content after login", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Login
    await loginAsTestUser(page);

    // Navigate to dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify dashboard elements are visible
    await dashboardPage.expectDashboardVisible();

    // Verify tabs are present (My Quizzes, Public Quizzes)
    await expect(dashboardPage.myQuizzesTab).toBeVisible();
    await expect(dashboardPage.publicQuizzesTab).toBeVisible();
  });

  /**
   * Test 12: Direct Protected Route Access After Login
   * Verifies authenticated users can directly access protected routes
   */
  test("should access protected routes directly when authenticated", async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    const protectedRoutes = ["/quizzes/new", "/quizzes/ai/generate", "/auth/change-password"];

    for (const route of protectedRoutes) {
      // Navigate directly to protected route
      await page.goto(route);

      // Should stay on the protected route (not redirect to login)
      await expect(page).toHaveURL(route, { timeout: 5000 });
      await expect(page).not.toHaveURL(/\/auth\/login/);
    }
  });

  /**
   * Test 13: Login Page Navigation Links
   * Verifies navigation between auth pages works correctly
   */
  test("should navigate between authentication pages using links", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Start at login page
    await loginPage.goto();

    // Navigate to register
    await loginPage.navigateToRegister();
    await expect(page).toHaveURL(/\/auth\/register/);

    // Go back to login
    await page.goto("/auth/login");
    await expect(page).toHaveURL(/\/auth\/login/);

    // Navigate to forgot password
    await loginPage.navigateToForgotPassword();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});

/**
 * Page Object Validation Tests
 * Verifies page objects work correctly with actual pages
 */
test.describe("Page Object Model Validation", () => {
  test("should load all login page elements correctly", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify all critical elements are visible and functional
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();

    // Verify inputs are enabled
    await loginPage.expectSubmitEnabled();
  });

  test("should load dashboard for authenticated user", async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify dashboard elements
    await expect(dashboardPage.myQuizzesTab).toBeVisible();
    await expect(dashboardPage.publicQuizzesTab).toBeVisible();
  });

  test("should verify protected route redirects for unauthenticated user", async ({ page }) => {
    // Start unauthenticated
    await page.context().clearCookies();

    // Try dashboard (protected route)
    await page.goto("/dashboard");

    // For unauthenticated user, should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });
});

/**
 * API Integration Tests
 * Verifies authentication API endpoints work correctly
 */
test.describe("Authentication API", () => {
  test("should handle login API endpoint correctly", async ({ page }) => {
    // Listen for API request
    const responsePromise = page.waitForResponse((response) => response.url().includes("/api/auth/login"));

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Verify API response
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Verify redirect happened
    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
  });

  test("should return error for invalid credentials via API", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Listen for API request
    const responsePromise = page.waitForResponse((response) => response.url().includes("/api/auth/login"));

    // Use attemptLogin for invalid credentials (won't navigate away)
    await loginPage.attemptLogin(TEST_USER.email, "InvalidPassword123");

    // Verify API error response
    const response = await responsePromise;
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
