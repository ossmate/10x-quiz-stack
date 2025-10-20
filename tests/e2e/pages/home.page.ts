import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Home Page (Dashboard)
 * The homepage shows the public dashboard with quiz tabs
 */
export class HomePage {
  readonly page: Page;
  readonly dashboardHeading: Locator;
  readonly myQuizzesTab: Locator;
  readonly publicQuizzesTab: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Dashboard shows "Dashboard" heading
    this.dashboardHeading = page.getByRole("heading", { name: /dashboard/i });
    // Dashboard tabs
    this.myQuizzesTab = page.getByRole("tab", { name: /my quizzes/i });
    this.publicQuizzesTab = page.getByRole("tab", { name: /public quizzes/i });
    // Header navigation links (exact text matches from AuthButtons component)
    this.loginButton = page.getByRole("link", { name: "Login" });
    this.registerButton = page.getByRole("link", { name: "Register" });
  }

  async goto() {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  async clickLogin() {
    // Wait for auth buttons to finish loading (skeleton disappears)
    await this.loginButton.waitFor({ state: "visible" });
    await this.loginButton.click();
  }

  async clickRegister() {
    // Wait for auth buttons to finish loading (skeleton disappears)
    await this.registerButton.waitFor({ state: "visible" });
    await this.registerButton.click();
  }
}
