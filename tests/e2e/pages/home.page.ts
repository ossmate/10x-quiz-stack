import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Home Page
 * Encapsulates page interactions and elements for maintainable tests
 */
export class HomePage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole("heading", { name: /welcome/i });
    this.loginButton = page.getByRole("link", { name: /log in/i });
    this.registerButton = page.getByRole("link", { name: /register/i });
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async clickRegister() {
    await this.registerButton.click();
  }
}
