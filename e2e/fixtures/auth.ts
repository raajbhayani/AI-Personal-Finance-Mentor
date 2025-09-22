import { test as base, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Extend the base test with authentication helpers
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Login as regular test user
    await loginAsUser(page, 'test@example.com', 'Password123!');
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    // Login as admin user
    await loginAsUser(page, 'admin@example.com', 'AdminPass123!');
    await use(page);
  },
});

export { expect };

// Helper function to login
async function loginAsUser(page: Page, email: string, password: string) {
  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });

  // Fill in credentials
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);

  // Submit login form
  await page.click('[data-testid="login-submit"]');

  // Wait for successful login (redirect to dashboard)
  await page.waitForURL('/dashboard', { timeout: 10000 });

  // Verify we're logged in by checking for user menu or dashboard content
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
}

// Helper function to logout
export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout option
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to home page or login page
  await page.waitForURL(/\/(login|home|$)/, { timeout: 5000 });
}

// Helper function to check if user is logged in
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Helper function to navigate to a protected page
export async function navigateToProtectedPage(page: Page, path: string) {
  await page.goto(path);

  // If redirected to login, we're not authenticated
  if (page.url().includes('/login')) {
    throw new Error('User not authenticated - redirected to login');
  }
}

// Helper function to fill transaction form
export async function fillTransactionForm(
  page: Page,
  transaction: {
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    date?: string;
    tags?: string[];
  }
) {
  await page.fill('[data-testid="amount-input"]', transaction.amount.toString());
  await page.selectOption('[data-testid="type-select"]', transaction.type);
  await page.selectOption('[data-testid="category-select"]', transaction.category);
  await page.fill('[data-testid="description-input"]', transaction.description);

  if (transaction.date) {
    await page.fill('[data-testid="date-input"]', transaction.date);
  }

  if (transaction.tags && transaction.tags.length > 0) {
    const tagsInput = page.locator('[data-testid="tags-input"]');
    await tagsInput.fill(transaction.tags.join(', '));
  }
}

// Helper function to fill goal form
export async function fillGoalForm(
  page: Page,
  goal: {
    name: string;
    targetAmount: number;
    targetDate: string;
    category: string;
    description?: string;
  }
) {
  await page.fill('[data-testid="goal-name-input"]', goal.name);
  await page.fill('[data-testid="goal-target-amount-input"]', goal.targetAmount.toString());
  await page.fill('[data-testid="goal-target-date-input"]', goal.targetDate);
  await page.selectOption('[data-testid="goal-category-select"]', goal.category);

  if (goal.description) {
    await page.fill('[data-testid="goal-description-input"]', goal.description);
  }
}

// Helper function to wait for API call completion
export async function waitForAPICall(page: Page, urlPattern: string | RegExp) {
  await page.waitForResponse(urlPattern, { timeout: 10000 });
}

// Helper function to verify toast notification
export async function verifyToast(page: Page, message: string, type: 'success' | 'error' | 'warning' = 'success') {
  const toastSelector = `[data-testid="toast-${type}"]`;
  await page.waitForSelector(toastSelector, { timeout: 5000 });

  const toastText = await page.textContent(toastSelector);
  expect(toastText).toContain(message);

  // Wait for toast to disappear (auto-dismiss)
  await page.waitForSelector(toastSelector, { state: 'hidden', timeout: 10000 });
}

// Helper function to verify error message
export async function verifyErrorMessage(page: Page, message: string) {
  const errorSelector = '[data-testid="error-message"]';
  await page.waitForSelector(errorSelector, { timeout: 5000 });

  const errorText = await page.textContent(errorSelector);
  expect(errorText).toContain(message);
}

// Helper function to verify loading state
export async function verifyLoadingState(page: Page, shouldBeLoading: boolean = true) {
  const loadingSelector = '[data-testid="loading-spinner"]';

  if (shouldBeLoading) {
    await page.waitForSelector(loadingSelector, { timeout: 5000 });
  } else {
    await page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 5000 });
  }
}

// Helper function to verify page title
export async function verifyPageTitle(page: Page, expectedTitle: string) {
  const title = await page.title();
  expect(title).toContain(expectedTitle);
}

// Helper function to simulate mobile device
export async function simulateMobileDevice(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
}

// Helper function to simulate slow network
export async function simulateSlowNetwork(page: Page) {
  await page.route('**/*', (route) => {
    // Add 2 second delay to all requests
    setTimeout(() => route.continue(), 2000);
  });
}

// Helper function to mock API response
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: any,
  status: number = 200
) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

// Helper function to take screenshot with timestamp
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

// Helper function to check accessibility
export async function checkAccessibility(page: Page) {
  // This would integrate with axe-core in a real implementation
  // For now, we'll check basic accessibility markers
  const missingAltImages = await page.locator('img:not([alt])').count();
  expect(missingAltImages).toBe(0);

  const missingLabels = await page.locator('input:not([aria-label]):not([aria-labelledby])').count();
  expect(missingLabels).toBe(0);
}

// Helper function to verify responsive design
export async function checkResponsiveDesign(page: Page) {
  const viewports = [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1024, height: 768, name: 'desktop' },
    { width: 1920, height: 1080, name: 'large-desktop' },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500); // Allow layout to adjust

    // Take screenshot for visual regression testing
    await page.screenshot({
      path: `test-results/responsive/${viewport.name}.png`,
      fullPage: true,
    });

    // Check that essential elements are visible
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();
  }
}

// Helper function to verify form validation
export async function testFormValidation(
  page: Page,
  formSelector: string,
  validationTests: Array<{
    field: string;
    invalidValue: string;
    expectedError: string;
  }>
) {
  for (const test of validationTests) {
    // Clear and fill field with invalid value
    await page.fill(`${formSelector} [data-testid="${test.field}"]`, '');
    await page.fill(`${formSelector} [data-testid="${test.field}"]`, test.invalidValue);

    // Try to submit form
    await page.click(`${formSelector} [type="submit"]`);

    // Verify error message appears
    await verifyErrorMessage(page, test.expectedError);

    // Clear the field for next test
    await page.fill(`${formSelector} [data-testid="${test.field}"]`, '');
  }
}