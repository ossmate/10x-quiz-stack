import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Dashboard Page (Protected Route)
 * Encapsulates dashboard interactions and quiz listings
 */
export class DashboardPage {
  readonly page: Page;

  // Tab navigation
  readonly myQuizzesTab: Locator;
  readonly publicQuizzesTab: Locator;

  // Page elements
  readonly heading: Locator;
  readonly createQuizButton: Locator;
  readonly aiGenerateButton: Locator;

  // Quiz list elements
  readonly quizCards: Locator;
  readonly emptyState: Locator;

  // Pagination
  readonly paginationContainer: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tab navigation - using role=tab for accessibility
    this.myQuizzesTab = page.getByRole("tab", { name: /my quizzes/i });
    this.publicQuizzesTab = page.getByRole("tab", { name: /public quizzes/i });

    // Page heading
    this.heading = page.getByRole("heading", { level: 1 }).first();

    // Action buttons - using accessible selectors
    this.createQuizButton = page.getByRole("link", { name: /create quiz|new quiz/i });
    this.aiGenerateButton = page.getByRole("link", { name: /generate.*ai|ai.*generate/i });

    // Quiz listings
    this.quizCards = page.locator('[data-testid="quiz-card"]').or(page.locator('article, [role="article"]'));
    this.emptyState = page
      .locator('[data-testid="empty-state"]')
      .or(page.locator("text=/no quizzes|create your first/i"));

    // Pagination
    this.paginationContainer = page
      .locator('[data-testid="pagination"]')
      .or(page.locator('nav[aria-label*="pagination"]'));
    this.nextPageButton = page.getByRole("button", { name: /next/i });
    this.prevPageButton = page.getByRole("button", { name: /previous|prev/i });
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto("/dashboard");
  }

  /**
   * Wait for dashboard to load
   */
  async waitForLoad() {
    await expect(this.page).toHaveURL("/dashboard");
    // Wait for either tabs to be visible or page to be fully loaded
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Switch to My Quizzes tab
   */
  async switchToMyQuizzes() {
    await this.myQuizzesTab.click();
    await expect(this.myQuizzesTab).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Switch to Public Quizzes tab
   */
  async switchToPublicQuizzes() {
    await this.publicQuizzesTab.click();
    await expect(this.publicQuizzesTab).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Navigate to create quiz page
   */
  async navigateToCreateQuiz() {
    await this.createQuizButton.click();
    await expect(this.page).toHaveURL(/\/quizzes\/new/);
  }

  /**
   * Navigate to AI quiz generation page
   */
  async navigateToAIGenerate() {
    await this.aiGenerateButton.click();
    await expect(this.page).toHaveURL(/\/quizzes\/ai\/generate/);
  }

  /**
   * Get count of quiz cards displayed
   */
  async getQuizCount(): Promise<number> {
    return await this.quizCards.count();
  }

  /**
   * Click on a quiz card by index
   */
  async clickQuiz(index = 0) {
    await this.quizCards.nth(index).click();
  }

  /**
   * Click on a quiz card by title
   */
  async clickQuizByTitle(title: string) {
    await this.page.getByRole("heading", { name: title }).click();
  }

  /**
   * Verify dashboard is displayed (user is authenticated)
   */
  async expectDashboardVisible() {
    await expect(this.page).toHaveURL("/dashboard");
    // Check for dashboard-specific elements
    await expect(this.myQuizzesTab).toBeVisible();
  }

  /**
   * Verify empty state is shown
   */
  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Verify at least one quiz is displayed
   */
  async expectQuizzesVisible() {
    await expect(this.quizCards.first()).toBeVisible();
  }

  /**
   * Go to next page in pagination
   */
  async goToNextPage() {
    await this.nextPageButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to previous page in pagination
   */
  async goToPreviousPage() {
    await this.prevPageButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Verify user is on a specific page number
   */
  async expectPageNumber(pageNum: number) {
    const url = new URL(this.page.url());
    const currentPage = url.searchParams.get("page") || "1";
    expect(currentPage).toBe(pageNum.toString());
  }

  /**
   * Verify current tab is selected
   */
  async expectTabSelected(tabName: "my" | "public") {
    const tab = tabName === "my" ? this.myQuizzesTab : this.publicQuizzesTab;
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }
}
