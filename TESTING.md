# Testing Guide

This project uses **Vitest** for unit testing and **Playwright** for E2E testing.

## Unit Testing with Vitest

### Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Unit Tests

Create test files with `.test.ts` or `.spec.ts` extension in the `src` directory:

```typescript
import { describe, it, expect, vi } from "vitest";

describe("MyComponent", () => {
  it("should render correctly", () => {
    expect(true).toBe(true);
  });
});
```

### Testing React Components

Use `@testing-library/react` for component tests:

```typescript
import { render, screen } from "@/test/utils/test-utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should display text", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Mocking Supabase

Use the provided Supabase mock:

```typescript
import { mockSupabaseClient } from "@/test/mocks/supabase.mock";
import { vi } from "vitest";

vi.mock("@/db/supabase.client", () => ({
  supabaseClient: mockSupabaseClient,
}));
```

## E2E Testing with Playwright

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen
```

### Writing E2E Tests

Create test files in the `tests/e2e` directory:

```typescript
import { test, expect } from "@playwright/test";

test("should navigate to home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading")).toBeVisible();
});
```

### Page Object Model

Use the Page Object Model pattern for maintainable tests:

```typescript
// tests/e2e/pages/login.page.ts
import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Login" });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

## Best Practices

### Unit Tests

- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies (API calls, database, etc.)
- Keep tests isolated and independent
- Use `describe` blocks to group related tests
- Run tests in watch mode during development

### E2E Tests

- Use the Page Object Model for reusable page interactions
- Leverage Playwright's auto-waiting capabilities
- Use semantic locators (role, label, text) over CSS selectors
- Test user flows, not implementation details
- Keep tests independent and able to run in any order
- Use browser contexts for test isolation
- Implement proper setup and teardown

## Configuration

### Vitest Configuration

See `vitest.config.ts` for configuration options:

- Test environment: jsdom
- Setup file: `src/test/setup.ts`
- Coverage provider: v8

### Playwright Configuration

See `playwright.config.ts` for configuration options:

- Browser: Chromium (Desktop Chrome)
- Base URL: http://localhost:4321
- Test directory: `tests/e2e`

## Continuous Integration

Tests run automatically in CI/CD pipelines via GitHub Actions:

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:

- ✅ **Unit tests**: `npm run test:run`
- ✅ **Coverage**: `npm run test:coverage`
- ✅ **E2E tests**: `npm run test:e2e` (Playwright)
- ✅ **Build**: `npm run build`
- ✅ **Security audit**: `npm audit`

### Required GitHub Secrets

For E2E tests to run in CI, configure these secrets in your repository:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anonymous key
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password

See [.github/SECRETS_SETUP.md](.github/SECRETS_SETUP.md) for detailed setup instructions.

### Running Tests Locally

```bash
# Run all tests (unit + E2E)
npm run test:run && npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Viewing Test Results

- **Unit tests**: Results appear in terminal
- **E2E tests**: HTML report generated in `playwright-report/`
- **CI artifacts**: Download Playwright reports from GitHub Actions artifacts
