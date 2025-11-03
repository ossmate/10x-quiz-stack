import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Home Page (Public Landing Page)
 * The homepage is a public marketing/landing page showing features and demo quizzes
 */
export class HomePage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly getStartedButton: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly dashboardButton: Locator;
  readonly featuresSection: Locator;
  readonly demoQuizzesSection: Locator;

  constructor(page: Page) {
    this.page = page;
    // Hero section heading
    this.heroHeading = page.getByRole("heading", { name: /create.*share.*take.*interactive quizzes/i });
    // CTA buttons (use .first() to avoid strict mode violation since "Go to Dashboard" appears twice)
    this.getStartedButton = page.getByRole("link", { name: /get started free/i });
    this.dashboardButton = page.getByRole("link", { name: /go to dashboard/i }).first();
    // Header navigation links (exact text matches from AuthButtons component)
    this.loginButton = page.getByRole("link", { name: "Login" });
    this.registerButton = page.getByRole("link", { name: "Register" });
    // Page sections
    this.featuresSection = page.getByRole("heading", { name: /everything you need/i });
    this.demoQuizzesSection = page.getByRole("heading", { name: /try it out.*no sign up required/i });
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
