# Testing Quick Reference

## Vitest - Unit Testing

### Basic Test Structure
```typescript
import { describe, it, expect } from "vitest";

describe("Feature Name", () => {
  it("should do something", () => {
    // Arrange
    const input = "test";
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

### React Component Testing
```typescript
import { render, screen } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render with props", () => {
    render(<MyComponent name="John" />);
    expect(screen.getByText("John")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

### Mocking Functions
```typescript
import { vi } from "vitest";

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue("value");
mockFn.mockResolvedValue("async value");

// Spy on a method
const spy = vi.spyOn(object, "method");
expect(spy).toHaveBeenCalled();
```

### Mocking Modules
```typescript
import { vi } from "vitest";

// Mock entire module
vi.mock("@/lib/api", () => ({
  fetchData: vi.fn().mockResolvedValue({ data: "test" }),
}));

// Mock Supabase
vi.mock("@/db/supabase.client", () => ({
  supabaseClient: mockSupabaseClient,
}));
```

### Async Testing
```typescript
it("should handle async operations", async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

it("should wait for element", async () => {
  render(<AsyncComponent />);
  const element = await screen.findByText("Loaded");
  expect(element).toBeInTheDocument();
});
```

## Playwright - E2E Testing

### Basic Test Structure
```typescript
import { test, expect } from "@playwright/test";

test("should navigate to page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading")).toBeVisible();
});
```

### Page Object Model
```typescript
// pages/login.page.ts
import { type Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Login" }).click();
  }
}

// test file
import { LoginPage } from "./pages/login.page";

test("user can login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto("/login");
  await loginPage.login("user@example.com", "password");
  await expect(page).toHaveURL("/dashboard");
});
```

### Locators (Semantic)
```typescript
// Preferred - by role
await page.getByRole("button", { name: "Submit" });
await page.getByRole("link", { name: "Home" });
await page.getByRole("textbox", { name: "Email" });

// By label
await page.getByLabel("Email address");

// By text
await page.getByText("Welcome");

// By test ID (last resort)
await page.getByTestId("submit-button");
```

### User Interactions
```typescript
// Click
await page.getByRole("button").click();

// Fill input
await page.getByLabel("Email").fill("test@example.com");

// Select option
await page.getByRole("combobox").selectOption("option1");

// Check checkbox
await page.getByRole("checkbox").check();

// Upload file
await page.getByLabel("Upload").setInputFiles("path/to/file");
```

### Assertions
```typescript
// Visibility
await expect(page.getByText("Hello")).toBeVisible();
await expect(page.getByText("Hidden")).toBeHidden();

// Text content
await expect(page.getByRole("heading")).toHaveText("Title");
await expect(page.getByRole("heading")).toContainText("Partial");

// URL
await expect(page).toHaveURL("/dashboard");
await expect(page).toHaveURL(/.*\/dashboard/);

// Count
await expect(page.getByRole("listitem")).toHaveCount(5);

// Attribute
await expect(page.getByRole("link")).toHaveAttribute("href", "/home");
```

### Waiting and Timing
```typescript
// Wait for element
await page.waitForSelector('text=Loaded');

// Wait for URL
await page.waitForURL('/dashboard');

// Wait for response
await page.waitForResponse(response => 
  response.url().includes('/api/') && response.status() === 200
);

// Manual wait (avoid when possible)
await page.waitForTimeout(1000);
```

### Test Hooks
```typescript
import { test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  // Cleanup
});

test.describe("Feature", () => {
  test.beforeAll(async () => {
    // Setup once
  });

  test.afterAll(async () => {
    // Cleanup once
  });
});
```

### Browser Context
```typescript
test("with custom context", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: "en-US",
  });
  
  const page = await context.newPage();
  await page.goto("/");
  
  await context.close();
});
```

## Common Testing Patterns

### Testing Forms
```typescript
// Unit test
it("should validate form input", async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  await user.type(screen.getByLabelText("Email"), "invalid");
  await user.click(screen.getByRole("button", { name: "Submit" }));
  
  expect(screen.getByText("Invalid email")).toBeInTheDocument();
});

// E2E test
test("should submit form", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/dashboard");
});
```

### Testing API Calls
```typescript
// Unit test
it("should fetch data", async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: "test" }),
  });
  global.fetch = mockFetch;
  
  const result = await fetchData();
  expect(result).toEqual({ data: "test" });
});

// E2E test
test("should load data from API", async ({ page }) => {
  await page.route("**/api/data", route => 
    route.fulfill({ json: { data: "test" } })
  );
  
  await page.goto("/");
  await expect(page.getByText("test")).toBeVisible();
});
```

### Testing Error States
```typescript
// Unit test
it("should display error message", async () => {
  const mockFetch = vi.fn().mockRejectedValue(new Error("Failed"));
  global.fetch = mockFetch;
  
  render(<DataComponent />);
  
  await screen.findByText("Error: Failed");
});

// E2E test
test("should show error on failed request", async ({ page }) => {
  await page.route("**/api/data", route => 
    route.fulfill({ status: 500 })
  );
  
  await page.goto("/");
  await expect(page.getByText("Error loading data")).toBeVisible();
});
```

## Debugging

### Vitest
```bash
# Run specific test file
npm run test -- src/lib/utils.test.ts

# Run tests matching pattern
npm run test -- -t "should validate"

# Run with UI
npm run test:ui

# Debug in VS Code
# Add breakpoint and use Debug Test button
```

### Playwright
```bash
# Run in debug mode
npm run test:e2e:debug

# Run specific test
npm run test:e2e -- home.spec.ts

# Run with UI mode
npm run test:e2e:ui

# View trace
npx playwright show-trace trace.zip
```
