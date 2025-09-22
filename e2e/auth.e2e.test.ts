import { test, expect } from './fixtures/auth';
import { logout, verifyToast, verifyErrorMessage, testFormValidation } from './fixtures/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the home page
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      // Navigate to signup page
      await page.click('[data-testid="signup-link"]');
      await expect(page).toHaveURL('/signup');

      // Fill registration form
      await page.fill('[data-testid="name-input"]', 'New Test User');
      await page.fill('[data-testid="email-input"]', 'newuser@example.com');
      await page.fill('[data-testid="password-input"]', 'NewPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');

      // Accept terms and conditions
      await page.check('[data-testid="terms-checkbox"]');

      // Submit form
      await page.click('[data-testid="signup-submit"]');

      // Should redirect to verification page or dashboard
      await page.waitForURL(/\/(verify-email|dashboard)/);

      // Verify success message
      await verifyToast(page, 'Account created successfully');
    });

    test('should show validation errors for invalid registration data', async ({ page }) => {
      await page.click('[data-testid="signup-link"]');
      await expect(page).toHaveURL('/signup');

      await testFormValidation(page, '[data-testid="signup-form"]', [
        {
          field: 'email-input',
          invalidValue: 'invalid-email',
          expectedError: 'Please enter a valid email address',
        },
        {
          field: 'password-input',
          invalidValue: '123',
          expectedError: 'Password must be at least 8 characters',
        },
        {
          field: 'name-input',
          invalidValue: '',
          expectedError: 'Name is required',
        },
      ]);
    });

    test('should show error for duplicate email', async ({ page }) => {
      await page.click('[data-testid="signup-link"]');

      // Try to register with existing email
      await page.fill('[data-testid="name-input"]', 'Duplicate User');
      await page.fill('[data-testid="email-input"]', 'test@example.com'); // Existing user
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Password123!');
      await page.check('[data-testid="terms-checkbox"]');

      await page.click('[data-testid="signup-submit"]');

      await verifyErrorMessage(page, 'An account with this email already exists');
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.click('[data-testid="signup-link"]');

      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@newdomain.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');

      await page.click('[data-testid="signup-submit"]');

      await verifyErrorMessage(page, 'Passwords do not match');
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.click('[data-testid="login-link"]');
      await expect(page).toHaveURL('/login');

      // Fill login form
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');

      // Submit form
      await page.click('[data-testid="login-submit"]');

      // Should redirect to dashboard
      await page.waitForURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // Verify welcome message or user name is displayed
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.click('[data-testid="login-link"]');

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword');

      await page.click('[data-testid="login-submit"]');

      await verifyErrorMessage(page, 'Invalid email or password');
      await expect(page).toHaveURL('/login'); // Should stay on login page
    });

    test('should show error for non-existent user', async ({ page }) => {
      await page.click('[data-testid="login-link"]');

      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');

      await page.click('[data-testid="login-submit"]');

      await verifyErrorMessage(page, 'Invalid email or password');
    });

    test('should handle login form validation', async ({ page }) => {
      await page.click('[data-testid="login-link"]');

      await testFormValidation(page, '[data-testid="login-form"]', [
        {
          field: 'email-input',
          invalidValue: '',
          expectedError: 'Email is required',
        },
        {
          field: 'password-input',
          invalidValue: '',
          expectedError: 'Password is required',
        },
        {
          field: 'email-input',
          invalidValue: 'invalid-email',
          expectedError: 'Please enter a valid email address',
        },
      ]);
    });

    test('should remember login with "Remember Me" checkbox', async ({ page }) => {
      await page.click('[data-testid="login-link"]');

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.check('[data-testid="remember-me-checkbox"]');

      await page.click('[data-testid="login-submit"]');
      await page.waitForURL('/dashboard');

      // Simulate closing and reopening browser by reloading
      await page.reload();

      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should show forgot password link and navigate correctly', async ({ page }) => {
      await page.click('[data-testid="login-link"]');

      await expect(page.locator('[data-testid="forgot-password-link"]')).toBeVisible();
      await page.click('[data-testid="forgot-password-link"]');

      await expect(page).toHaveURL('/forgot-password');
      await expect(page.locator('[data-testid="forgot-password-form"]')).toBeVisible();
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ authenticatedPage: page }) => {
      // User is already logged in via fixture
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // Logout
      await logout(page);

      // Should redirect to home page and remove user session
      await expect(page).toHaveURL(/\/(home|login|$)/);
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
    });

    test('should clear session data on logout', async ({ authenticatedPage: page }) => {
      // Navigate to dashboard to verify user is logged in
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // Logout
      await logout(page);

      // Try to navigate to protected page
      await page.goto('/dashboard');

      // Should redirect to login page
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected routes without authentication', async ({ page }) => {
      const protectedRoutes = ['/dashboard', '/transactions', '/goals', '/analytics', '/profile'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/login');
      }
    });

    test('should allow access to protected routes when authenticated', async ({ authenticatedPage: page }) => {
      const protectedRoutes = [
        { path: '/dashboard', testId: 'dashboard-content' },
        { path: '/transactions', testId: 'transactions-list' },
        { path: '/goals', testId: 'goals-list' },
        { path: '/analytics', testId: 'analytics-dashboard' },
        { path: '/profile', testId: 'profile-form' },
      ];

      for (const route of protectedRoutes) {
        await page.goto(route.path);
        await expect(page).toHaveURL(route.path);
        await expect(page.locator(`[data-testid="${route.testId}"]`)).toBeVisible();
      }
    });

    test('should maintain authentication state across page refreshes', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // Refresh page
      await page.reload();

      // Should still be logged in and on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should handle session expiration gracefully', async ({ authenticatedPage: page }) => {
      // Mock expired token response
      await page.route('**/api/**', (route) => {
        if (route.request().headers().authorization) {
          route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
            }),
          });
        } else {
          route.continue();
        }
      });

      // Try to access an API endpoint
      await page.goto('/transactions');

      // Should show session expired message and redirect to login
      await verifyToast(page, 'Your session has expired', 'warning');
      await expect(page).toHaveURL('/login');
    });

    test('should refresh tokens automatically when near expiration', async ({ authenticatedPage: page }) => {
      // Mock token refresh endpoint
      await page.route('**/api/auth/refresh', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
            },
          }),
        });
      });

      // Stay on a page for a while to trigger token refresh
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Should still be logged in with new tokens
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should enforce rate limiting on login attempts', async ({ page }) => {
      await page.click('[data-testid="login-link"]');

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'WrongPassword');
        await page.click('[data-testid="login-submit"]');

        if (i < 4) {
          await verifyErrorMessage(page, 'Invalid email or password');
        } else {
          // Should be rate limited after 5 attempts
          await verifyErrorMessage(page, 'Too many login attempts');
        }

        // Clear form for next attempt
        await page.fill('[data-testid="email-input"]', '');
        await page.fill('[data-testid="password-input"]', '');
      }
    });

    test('should show device verification for new devices', async ({ page, context }) => {
      // Create new browser context to simulate new device
      const newContext = await page.context().browser()!.newContext();
      const newPage = await newContext.newPage();

      await newPage.goto('/login');
      await newPage.fill('[data-testid="email-input"]', 'test@example.com');
      await newPage.fill('[data-testid="password-input"]', 'Password123!');
      await newPage.click('[data-testid="login-submit"]');

      // Should show device verification screen or additional security check
      await expect(newPage.locator('[data-testid="device-verification"]')).toBeVisible();

      await newContext.close();
    });

    test('should logout from all devices when requested', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/security');

      await page.click('[data-testid="logout-all-devices-button"]');

      // Confirm action
      await page.click('[data-testid="confirm-logout-all"]');

      // Should be logged out and redirected
      await expect(page).toHaveURL('/login');
      await verifyToast(page, 'Logged out from all devices');
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible on login page', async ({ page }) => {
      await page.goto('/login');

      // Check for proper labels and ARIA attributes
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label');

      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();

      // Check for focus management
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/login');

      // Navigate through form using keyboard
      await page.keyboard.press('Tab'); // Email input
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password input
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Remember me checkbox
      await expect(page.locator('[data-testid="remember-me-checkbox"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('[data-testid="login-submit"]')).toBeFocused();

      // Submit form using Enter key
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.keyboard.press('Enter');

      await page.waitForURL('/dashboard');
    });
  });
});