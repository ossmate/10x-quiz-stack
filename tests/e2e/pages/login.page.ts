import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Login Page
 * Encapsulates login form interactions and validations
 */
export class LoginPage {
  readonly page: Page;

  // Form elements
  readonly emailOrUsernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Links
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  // Error/Success messages
  readonly formError: Locator;
  readonly emailOrUsernameError: Locator;
  readonly passwordError: Locator;

  // Page heading
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form inputs using accessible labels
    this.emailOrUsernameInput = page.getByLabel(/email or username/i);
    this.passwordInput = page.getByLabel(/^password$/i);

    // Submit button
    this.submitButton = page.getByRole("button", { name: /sign in/i });

    // Links (scope to form to avoid header links)
    this.registerLink = page.locator("form").getByRole("link", { name: /register/i });
    this.forgotPasswordLink = page.locator("form").getByRole("link", { name: /forgot password/i });

    // Error messages
    this.formError = page.locator('[role="alert"]');
    this.emailOrUsernameError = page.locator("#emailOrUsername-error");
    this.passwordError = page.locator("#password-error");

    // Page heading
    this.heading = page.getByRole("heading", { name: /welcome back/i });
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto("/auth/login");
    await this.page.waitForLoadState("networkidle");
    await expect(this.heading).toBeVisible();
  }

  /**
   * Fill login form with credentials
   * Uses proper timing to avoid React state conflicts
   */
  async fillLoginForm(emailOrUsername: string, password: string) {
    // Clear and fill email field
    await this.emailOrUsernameInput.click();
    await this.emailOrUsernameInput.fill(emailOrUsername);

    // Small delay to ensure React state updates
    await this.page.waitForTimeout(100);

    // Clear and fill password field
    await this.passwordInput.click();
    await this.passwordInput.fill(password);

    // Small delay before submission
    await this.page.waitForTimeout(100);
  }

  /**
   * Submit the login form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete login flow with provided credentials
   * Waits for navigation after successful login
   */
  async login(emailOrUsername: string, password: string) {
    await this.fillLoginForm(emailOrUsername, password);

    // Wait for navigation after form submission (login redirects with window.location.href)
    await Promise.all([
      this.page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 10000 }),
      this.submit(),
    ]);
  }

  /**
   * Attempt login without waiting for navigation
   * Use this for testing invalid credentials where login might fail
   */
  async attemptLogin(emailOrUsername: string, password: string) {
    await this.fillLoginForm(emailOrUsername, password);
    await this.submit();
    // Wait for API response or UI update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Login with email
   */
  async loginWithEmail(email: string, password: string) {
    await this.login(email, password);
  }

  /**
   * Login with username
   */
  async loginWithUsername(username: string, password: string) {
    await this.login(username, password);
  }

  /**
   * Wait for successful login redirect to dashboard
   */
  async waitForSuccessRedirect() {
    await expect(this.page).toHaveURL("/", { timeout: 10000 });
  }

  /**
   * Wait for redirect to a specific page after login
   */
  async waitForRedirectTo(url: string | RegExp) {
    await expect(this.page).toHaveURL(url, { timeout: 10000 });
  }

  /**
   * Verify form error is displayed
   */
  async expectFormError(message: string | RegExp) {
    await expect(this.formError).toBeVisible();
    await expect(this.formError).toContainText(message);
  }

  /**
   * Verify email/username field error
   */
  async expectEmailOrUsernameError(message: string | RegExp) {
    await expect(this.emailOrUsernameError).toBeVisible();
    await expect(this.emailOrUsernameError).toContainText(message);
  }

  /**
   * Verify password field error
   */
  async expectPasswordError(message: string | RegExp) {
    await expect(this.passwordError).toBeVisible();
    await expect(this.passwordError).toContainText(message);
  }

  /**
   * Check if submit button is disabled
   */
  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Check if submit button is enabled
   */
  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Navigate to registration page via link
   */
  async navigateToRegister() {
    await this.registerLink.click();
    await expect(this.page).toHaveURL(/\/auth\/register/);
  }

  /**
   * Navigate to forgot password page via link
   */
  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
    await expect(this.page).toHaveURL(/\/auth\/forgot-password/);
  }

  /**
   * Verify user is redirected to login with redirect parameter
   */
  async expectRedirectParam(expectedPath: string) {
    const url = new URL(this.page.url());
    const redirectParam = url.searchParams.get("redirect");
    expect(redirectParam).toBe(expectedPath);
  }
}
