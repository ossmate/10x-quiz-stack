import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Registration Page
 * Encapsulates registration form interactions and validations
 */
export class RegisterPage {
  readonly page: Page;

  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  // Links
  readonly loginLink: Locator;

  // Error/Success messages
  readonly formError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;

  // Page heading
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form inputs using accessible labels
    this.emailInput = page.getByLabel(/^email$/i);
    this.passwordInput = page.getByLabel(/^password$/i).first();
    this.confirmPasswordInput = page.getByLabel(/confirm password/i);

    // Submit button
    this.submitButton = page.getByRole("button", { name: /create account/i });

    // Links
    this.loginLink = page.getByRole("link", { name: /login/i });

    // Error messages (using data-testid or aria-describedby pattern)
    this.formError = page.locator('[role="alert"]');
    this.emailError = page.locator("#email-error");
    this.passwordError = page.locator("#password-error");
    this.confirmPasswordError = page.locator("#confirmPassword-error");

    // Page heading
    this.heading = page.getByRole("heading", { name: /create your account/i });
  }

  /**
   * Navigate to registration page
   */
  async goto() {
    await this.page.goto("/auth/register");
    await expect(this.heading).toBeVisible();
  }

  /**
   * Fill the registration form with provided data
   */
  async fillRegistrationForm(data: { email: string; password: string; confirmPassword: string }) {
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
  }

  /**
   * Submit the registration form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete registration with valid data
   * Generates a unique user to avoid conflicts
   */
  async register(baseEmail = "testuser") {
    const timestamp = Date.now();
    const userData = {
      email: `${baseEmail}_${timestamp}@example.com`,
      password: "TestPass123!",
      confirmPassword: "TestPass123!",
    };

    await this.fillRegistrationForm(userData);
    await this.submit();

    return userData;
  }

  /**
   * Wait for successful registration redirect
   */
  async waitForSuccessRedirect() {
    await expect(this.page).toHaveURL(/\/auth\/verify-email/, { timeout: 10000 });
  }

  /**
   * Verify form validation error is displayed
   */
  async expectFormError(message: string | RegExp) {
    await expect(this.formError).toBeVisible();
    await expect(this.formError).toContainText(message);
  }

  /**
   * Verify email field error
   */
  async expectEmailError(message: string | RegExp) {
    await expect(this.emailError).toBeVisible();
    await expect(this.emailError).toContainText(message);
  }

  /**
   * Verify password field error
   */
  async expectPasswordError(message: string | RegExp) {
    await expect(this.passwordError).toBeVisible();
    await expect(this.passwordError).toContainText(message);
  }

  /**
   * Verify confirm password field error
   */
  async expectConfirmPasswordError(message: string | RegExp) {
    await expect(this.confirmPasswordError).toBeVisible();
    await expect(this.confirmPasswordError).toContainText(message);
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
   * Navigate to login page via link
   */
  async navigateToLogin() {
    await this.loginLink.click();
    await expect(this.page).toHaveURL(/\/auth\/login/);
  }
}
