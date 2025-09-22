import { test, expect } from './fixtures/auth';
import {
  fillTransactionForm,
  verifyToast,
  verifyErrorMessage,
  waitForAPICall,
  checkResponsiveDesign,
} from './fixtures/auth';

test.describe('Transactions Management', () => {
  test.describe('Transactions List', () => {
    test('should display user transactions', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');

      // Wait for transactions to load
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Should display at least some transactions from seed data
      const transactionItems = page.locator('[data-testid="transaction-item"]');
      await expect(transactionItems).toHaveCountGreaterThan(0);

      // Verify transaction details are displayed
      const firstTransaction = transactionItems.first();
      await expect(firstTransaction.locator('[data-testid="transaction-amount"]')).toBeVisible();
      await expect(firstTransaction.locator('[data-testid="transaction-description"]')).toBeVisible();
      await expect(firstTransaction.locator('[data-testid="transaction-category"]')).toBeVisible();
      await expect(firstTransaction.locator('[data-testid="transaction-date"]')).toBeVisible();
    });

    test('should filter transactions by type', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Filter by expense type
      await page.selectOption('[data-testid="type-filter"]', 'EXPENSE');
      await waitForAPICall(page, '**/api/transactions**');

      // All visible transactions should be expenses
      const transactionItems = page.locator('[data-testid="transaction-item"]');
      const count = await transactionItems.count();

      for (let i = 0; i < count; i++) {
        const typeElement = transactionItems.nth(i).locator('[data-testid="transaction-type"]');
        await expect(typeElement).toContainText('EXPENSE');
      }

      // Filter by income type
      await page.selectOption('[data-testid="type-filter"]', 'INCOME');
      await waitForAPICall(page, '**/api/transactions**');

      // All visible transactions should be income
      const incomeItems = page.locator('[data-testid="transaction-item"]');
      const incomeCount = await incomeItems.count();

      for (let i = 0; i < incomeCount; i++) {
        const typeElement = incomeItems.nth(i).locator('[data-testid="transaction-type"]');
        await expect(typeElement).toContainText('INCOME');
      }
    });

    test('should filter transactions by category', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Filter by food category
      await page.selectOption('[data-testid="category-filter"]', 'FOOD');
      await waitForAPICall(page, '**/api/transactions**');

      const transactionItems = page.locator('[data-testid="transaction-item"]');
      const count = await transactionItems.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const categoryElement = transactionItems.nth(i).locator('[data-testid="transaction-category"]');
          await expect(categoryElement).toContainText('FOOD');
        }
      }
    });

    test('should filter transactions by date range', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Set date range
      await page.fill('[data-testid="start-date-filter"]', '2024-01-01');
      await page.fill('[data-testid="end-date-filter"]', '2024-01-15');
      await page.click('[data-testid="apply-date-filter"]');

      await waitForAPICall(page, '**/api/transactions**');

      // Verify that all displayed transactions are within the date range
      const transactionItems = page.locator('[data-testid="transaction-item"]');
      const count = await transactionItems.count();

      for (let i = 0; i < count; i++) {
        const dateElement = transactionItems.nth(i).locator('[data-testid="transaction-date"]');
        const dateText = await dateElement.textContent();

        // Parse date and verify it's within range
        const transactionDate = new Date(dateText!);
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-15');

        expect(transactionDate >= startDate && transactionDate <= endDate).toBeTruthy();
      }
    });

    test('should search transactions by description', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Search for "grocery"
      await page.fill('[data-testid="search-input"]', 'grocery');
      await page.click('[data-testid="search-button"]');

      await waitForAPICall(page, '**/api/transactions**');

      const transactionItems = page.locator('[data-testid="transaction-item"]');
      const count = await transactionItems.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const descriptionElement = transactionItems.nth(i).locator('[data-testid="transaction-description"]');
          const description = await descriptionElement.textContent();
          expect(description!.toLowerCase()).toContain('grocery');
        }
      }
    });

    test('should paginate transactions', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Check if pagination controls are present
      const paginationElement = page.locator('[data-testid="pagination"]');
      if (await paginationElement.isVisible()) {
        const currentPage = page.locator('[data-testid="current-page"]');
        await expect(currentPage).toContainText('1');

        // Go to next page if available
        const nextButton = page.locator('[data-testid="next-page-button"]');
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await waitForAPICall(page, '**/api/transactions**');
          await expect(currentPage).toContainText('2');
        }
      }
    });

    test('should sort transactions', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Sort by amount ascending
      await page.selectOption('[data-testid="sort-select"]', 'amount_asc');
      await waitForAPICall(page, '**/api/transactions**');

      // Verify sorting
      const amountElements = page.locator('[data-testid="transaction-amount"]');
      const count = await amountElements.count();

      if (count > 1) {
        const amounts: number[] = [];
        for (let i = 0; i < count; i++) {
          const amountText = await amountElements.nth(i).textContent();
          const amount = parseFloat(amountText!.replace(/[^0-9.-]/g, ''));
          amounts.push(amount);
        }

        // Verify ascending order
        for (let i = 1; i < amounts.length; i++) {
          expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i - 1]);
        }
      }
    });
  });

  test.describe('Add Transaction', () => {
    test('should add new expense transaction', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.click('[data-testid="add-transaction-button"]');

      // Fill transaction form
      await fillTransactionForm(page, {
        amount: 75.50,
        type: 'EXPENSE',
        category: 'ENTERTAINMENT',
        description: 'Movie tickets and popcorn',
        date: '2024-01-25',
        tags: ['movies', 'entertainment', 'weekend'],
      });

      // Submit form
      await page.click('[data-testid="submit-transaction"]');

      await waitForAPICall(page, '**/api/transactions');
      await verifyToast(page, 'Transaction added successfully');

      // Verify transaction appears in list
      const newTransaction = page.locator('[data-testid="transaction-item"]').first();
      await expect(newTransaction.locator('[data-testid="transaction-description"]'))
        .toContainText('Movie tickets and popcorn');
      await expect(newTransaction.locator('[data-testid="transaction-amount"]'))
        .toContainText('75.50');
    });

    test('should add new income transaction', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.click('[data-testid="add-transaction-button"]');

      await fillTransactionForm(page, {
        amount: 1500,
        type: 'INCOME',
        category: 'FREELANCE',
        description: 'Web development project',
        date: '2024-01-26',
        tags: ['freelance', 'web-dev'],
      });

      await page.click('[data-testid="submit-transaction"]');

      await waitForAPICall(page, '**/api/transactions');
      await verifyToast(page, 'Transaction added successfully');

      // Verify income transaction
      const newTransaction = page.locator('[data-testid="transaction-item"]').first();
      await expect(newTransaction.locator('[data-testid="transaction-type"]'))
        .toContainText('INCOME');
      await expect(newTransaction.locator('[data-testid="transaction-amount"]'))
        .toContainText('1500');
    });

    test('should validate transaction form', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.click('[data-testid="add-transaction-button"]');

      // Try to submit empty form
      await page.click('[data-testid="submit-transaction"]');

      // Should show validation errors
      await verifyErrorMessage(page, 'Amount is required');
      await verifyErrorMessage(page, 'Type is required');
      await verifyErrorMessage(page, 'Category is required');
      await verifyErrorMessage(page, 'Description is required');

      // Test invalid amount
      await page.fill('[data-testid="amount-input"]', '-50');
      await page.click('[data-testid="submit-transaction"]');
      await verifyErrorMessage(page, 'Amount must be positive');

      // Test future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      await page.fill('[data-testid="date-input"]', futureDate.toISOString().split('T')[0]);
      await page.click('[data-testid="submit-transaction"]');
      await verifyErrorMessage(page, 'Date cannot be in the future');
    });

    test('should handle form cancellation', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.click('[data-testid="add-transaction-button"]');

      // Fill some data
      await page.fill('[data-testid="amount-input"]', '100');
      await page.fill('[data-testid="description-input"]', 'Test transaction');

      // Cancel form
      await page.click('[data-testid="cancel-transaction"]');

      // Should close form and return to transactions list
      await expect(page.locator('[data-testid="transaction-form"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="transactions-list"]')).toBeVisible();
    });
  });

  test.describe('Edit Transaction', () => {
    test('should edit existing transaction', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Click edit button on first transaction
      const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
      await firstTransaction.locator('[data-testid="edit-transaction-button"]').click();

      // Edit transaction details
      await page.fill('[data-testid="amount-input"]', '125.75');
      await page.fill('[data-testid="description-input"]', 'Updated transaction description');

      // Submit changes
      await page.click('[data-testid="submit-transaction"]');

      await waitForAPICall(page, '**/api/transactions/**');
      await verifyToast(page, 'Transaction updated successfully');

      // Verify changes
      await expect(firstTransaction.locator('[data-testid="transaction-amount"]'))
        .toContainText('125.75');
      await expect(firstTransaction.locator('[data-testid="transaction-description"]'))
        .toContainText('Updated transaction description');
    });

    test('should validate edited transaction', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
      await firstTransaction.locator('[data-testid="edit-transaction-button"]').click();

      // Try invalid amount
      await page.fill('[data-testid="amount-input"]', '0');
      await page.click('[data-testid="submit-transaction"]');

      await verifyErrorMessage(page, 'Amount must be greater than 0');
    });
  });

  test.describe('Delete Transaction', () => {
    test('should delete transaction with confirmation', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Get initial count
      const initialItems = await page.locator('[data-testid="transaction-item"]').count();

      // Click delete button on first transaction
      const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
      const transactionDescription = await firstTransaction
        .locator('[data-testid="transaction-description"]')
        .textContent();

      await firstTransaction.locator('[data-testid="delete-transaction-button"]').click();

      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');

      await waitForAPICall(page, '**/api/transactions/**');
      await verifyToast(page, 'Transaction deleted successfully');

      // Verify transaction is removed
      const finalItems = await page.locator('[data-testid="transaction-item"]').count();
      expect(finalItems).toBe(initialItems - 1);

      // Verify the specific transaction is no longer present
      const descriptions = await page.locator('[data-testid="transaction-description"]').allTextContents();
      expect(descriptions).not.toContain(transactionDescription);
    });

    test('should cancel transaction deletion', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      const initialItems = await page.locator('[data-testid="transaction-item"]').count();

      // Click delete button
      const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
      await firstTransaction.locator('[data-testid="delete-transaction-button"]').click();

      // Cancel deletion
      await page.click('[data-testid="cancel-delete"]');

      // Verify transaction is still present
      const finalItems = await page.locator('[data-testid="transaction-item"]').count();
      expect(finalItems).toBe(initialItems);
    });
  });

  test.describe('Transaction Details', () => {
    test('should view transaction details', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Click on first transaction to view details
      const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
      await firstTransaction.click();

      // Should show transaction details modal or page
      await expect(page.locator('[data-testid="transaction-details"]')).toBeVisible();

      // Verify all details are shown
      await expect(page.locator('[data-testid="detail-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-category"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="detail-tags"]')).toBeVisible();
    });

    test('should close transaction details', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
      await firstTransaction.click();

      await expect(page.locator('[data-testid="transaction-details"]')).toBeVisible();

      // Close details
      await page.click('[data-testid="close-details"]');

      await expect(page.locator('[data-testid="transaction-details"]')).not.toBeVisible();
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select multiple transactions', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      // Select first two transactions
      await page.check('[data-testid="transaction-checkbox"]:nth-child(1)');
      await page.check('[data-testid="transaction-checkbox"]:nth-child(2)');

      // Verify bulk actions are available
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('2 selected');
    });

    test('should bulk delete transactions', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');
      await page.waitForSelector('[data-testid="transactions-list"]');

      const initialItems = await page.locator('[data-testid="transaction-item"]').count();

      // Select multiple transactions
      await page.check('[data-testid="transaction-checkbox"]:nth-child(1)');
      await page.check('[data-testid="transaction-checkbox"]:nth-child(2)');

      // Bulk delete
      await page.click('[data-testid="bulk-delete-button"]');
      await page.click('[data-testid="confirm-bulk-delete"]');

      await waitForAPICall(page, '**/api/transactions/bulk');
      await verifyToast(page, '2 transactions deleted');

      // Verify transactions are removed
      const finalItems = await page.locator('[data-testid="transaction-item"]').count();
      expect(finalItems).toBe(initialItems - 2);
    });
  });

  test.describe('Export Functionality', () => {
    test('should export transactions to CSV', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');

      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');

      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-csv"]');

      // Wait for download to complete
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should export transactions to PDF', async ({ authenticatedPage: page }) => {
      await page.goto('/transactions');

      const downloadPromise = page.waitForEvent('download');

      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-pdf"]');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ authenticatedPage: page }) => {
      await checkResponsiveDesign(page);

      // Test mobile-specific functionality
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/transactions');

      // Mobile hamburger menu should be visible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

      // Transactions should be displayed in mobile layout
      await expect(page.locator('[data-testid="transactions-list"]')).toBeVisible();

      // Add transaction button should be accessible
      await expect(page.locator('[data-testid="add-transaction-button"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ authenticatedPage: page }) => {
      // Mock network error
      await page.route('**/api/transactions', route => route.abort());

      await page.goto('/transactions');

      // Should show error message
      await verifyErrorMessage(page, 'Failed to load transactions');

      // Should show retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle server errors', async ({ authenticatedPage: page }) => {
      // Mock server error
      await page.route('**/api/transactions', route =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'SYSTEM_ERROR', message: 'Internal server error' }
          })
        })
      );

      await page.goto('/transactions');

      await verifyErrorMessage(page, 'Something went wrong');
    });
  });
});