import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, testUtils } from '../../test/utils/testHelpers';
import {
  ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  FeatureErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  useRetry,
} from '../ErrorBoundary';
import { SystemError, ErrorCode } from '../../lib/errors/customErrors';

// Mock the logger
jest.mock('../../lib/logging/structuredLogger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock error reporting
jest.mock('../../lib/monitoring/errorReporting', () => ({
  errorReporting: {
    reportError: jest.fn().mockResolvedValue('test-report-id'),
    addBreadcrumb: jest.fn(),
  },
}));

const { ThrowError } = testUtils;

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      renderWithProviders(
        <ErrorBoundary>
          <div data-testid="child-component">Child Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('when an error occurs', () => {
    it('should catch and display error fallback UI', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/Component Error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });

    it('should show custom error message for network errors', () => {
      const networkError = new Error('Failed to fetch');

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={networkError} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Connection problem detected/i)).toBeInTheDocument();
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    });

    it('should show custom error message for chunk loading errors', () => {
      const chunkError = new Error('Loading chunk 1 failed');

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={chunkError} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/application has been updated/i)).toBeInTheDocument();
      expect(screen.getByText(/refresh the page/i)).toBeInTheDocument();
    });

    it('should display technical details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error('Test error message');

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText(/Test error message/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should call custom onError handler when provided', () => {
      const onErrorMock = jest.fn();

      renderWithProviders(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
        expect.any(String)
      );
    });
  });

  describe('retry functionality', () => {
    it('should allow retrying when enabled', async () => {
      const { user } = renderWithProviders(
        <ErrorBoundary enableRetry={true} maxRetries={3}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);

      // Should still show error after immediate retry
      await waitFor(() => {
        expect(screen.getByText(/try again \(1\/3\)/i)).toBeInTheDocument();
      });
    });

    it('should disable retry after max attempts', async () => {
      const { user } = renderWithProviders(
        <ErrorBoundary enableRetry={true} maxRetries={1}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/maximum retry attempts reached/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('should not show retry button when disabled', () => {
      renderWithProviders(
        <ErrorBoundary enableRetry={false}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = (error: Error, errorId: string, retry: () => void) => (
        <div data-testid="custom-fallback">
          <h1>Custom Error</h1>
          <p>Error: {error.message}</p>
          <p>ID: {errorId}</p>
          <button onClick={retry}>Custom Retry</button>
        </div>
      );

      renderWithProviders(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} error={new Error('Custom test error')} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText(/Custom test error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
    });
  });

  describe('error boundary levels', () => {
    it('should render PageErrorBoundary with page-level styling', () => {
      renderWithProviders(
        <PageErrorBoundary>
          <ThrowError shouldThrow={true} />
        </PageErrorBoundary>
      );

      expect(screen.getByText('Page Error')).toBeInTheDocument();
    });

    it('should render ComponentErrorBoundary with component-level styling', () => {
      renderWithProviders(
        <ComponentErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('should render FeatureErrorBoundary with feature-level styling', () => {
      renderWithProviders(
        <FeatureErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent = ({ shouldThrow }: { shouldThrow?: boolean }) => (
        <div>
          {shouldThrow && <ThrowError shouldThrow={true} />}
          <span data-testid="test-component">Test Component</span>
        </div>
      );

      const WrappedComponent = withErrorBoundary(TestComponent, {
        enableRetry: true,
        level: 'component',
      });

      renderWithProviders(<WrappedComponent />);
      expect(screen.getByTestId('test-component')).toBeInTheDocument();

      // Test error handling
      renderWithProviders(<WrappedComponent shouldThrow={true} />);
      expect(screen.getByText('Component Error')).toBeInTheDocument();
    });

    it('should preserve component display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';

      const WrappedComponent = withErrorBoundary(TestComponent);
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });
  });
});

describe('useErrorHandler hook', () => {
  const TestComponent = () => {
    const { handleError, clearError } = useErrorHandler();

    return (
      <div>
        <button
          onClick={() => handleError(new Error('Test async error'))}
          data-testid="trigger-error"
        >
          Trigger Error
        </button>
        <button onClick={clearError} data-testid="clear-error">
          Clear Error
        </button>
      </div>
    );
  };

  it('should throw error to be caught by error boundary', async () => {
    const { user } = renderWithProviders(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('trigger-error')).toBeInTheDocument();

    await user.click(screen.getByTestId('trigger-error'));

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});

describe('useRetry hook', () => {
  const TestComponent = () => {
    const { retry, reset, retryCount, isRetrying, canRetry } = useRetry(2);
    const [result, setResult] = React.useState<string>('');
    const [shouldFail, setShouldFail] = React.useState(true);

    const testOperation = async () => {
      if (shouldFail) {
        throw new Error('Operation failed');
      }
      setResult('Success!');
    };

    const handleRetry = async () => {
      try {
        await retry(testOperation);
      } catch (error) {
        setResult(`Failed after ${retryCount + 1} attempts`);
      }
    };

    return (
      <div>
        <div data-testid="result">{result}</div>
        <div data-testid="retry-count">Retry count: {retryCount}</div>
        <div data-testid="is-retrying">Is retrying: {isRetrying.toString()}</div>
        <div data-testid="can-retry">Can retry: {canRetry.toString()}</div>
        <button onClick={handleRetry} data-testid="retry-btn">
          Retry
        </button>
        <button onClick={() => setShouldFail(false)} data-testid="fix-btn">
          Fix Issue
        </button>
        <button onClick={reset} data-testid="reset-btn">
          Reset
        </button>
      </div>
    );
  };

  it('should handle retry logic correctly', async () => {
    const { user } = renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry count: 0');
    expect(screen.getByTestId('can-retry')).toHaveTextContent('Can retry: true');

    // First attempt (will fail)
    await user.click(screen.getByTestId('retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry count: 1');
    });

    // Second attempt (will fail)
    await user.click(screen.getByTestId('retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry count: 2');
      expect(screen.getByTestId('can-retry')).toHaveTextContent('Can retry: false');
    });

    // Third attempt should throw (max retries exceeded)
    await user.click(screen.getByTestId('retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('Failed after 3 attempts');
    });
  });

  it('should reset retry state', async () => {
    const { user } = renderWithProviders(<TestComponent />);

    // Trigger a retry
    await user.click(screen.getByTestId('retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry count: 1');
    });

    // Reset
    await user.click(screen.getByTestId('reset-btn'));

    expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry count: 0');
    expect(screen.getByTestId('can-retry')).toHaveTextContent('Can retry: true');
  });

  it('should succeed after fixing the issue', async () => {
    const { user } = renderWithProviders(<TestComponent />);

    // Fix the issue first
    await user.click(screen.getByTestId('fix-btn'));

    // Now retry should succeed
    await user.click(screen.getByTestId('retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('Success!');
      expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry count: 0');
    });
  });
});

describe('ErrorBoundary edge cases', () => {
  it('should handle errors during error reporting', () => {
    // Mock error reporting to throw
    const errorReporting = require('../../lib/monitoring/errorReporting');
    errorReporting.errorReporting.reportError.mockRejectedValue(new Error('Reporting failed'));

    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should still show error UI even if reporting fails
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('should handle cleanup on unmount', () => {
    const { unmount } = renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should not throw during unmount
    expect(() => unmount()).not.toThrow();
  });

  it('should generate unique error IDs', () => {
    const onError1 = jest.fn();
    const onError2 = jest.fn();

    renderWithProviders(
      <div>
        <ErrorBoundary onError={onError1}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary onError={onError2}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </div>
    );

    expect(onError1).toHaveBeenCalled();
    expect(onError2).toHaveBeenCalled();

    const errorId1 = onError1.mock.calls[0][2];
    const errorId2 = onError2.mock.calls[0][2];

    expect(errorId1).not.toBe(errorId2);
    expect(errorId1).toMatch(/^\d+-[a-z0-9]+$/);
    expect(errorId2).toMatch(/^\d+-[a-z0-9]+$/);
  });
});