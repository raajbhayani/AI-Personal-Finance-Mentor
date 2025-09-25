import { useState, useCallback } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

export interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

export interface ApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useApiState<T = any>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false,
  });

  const { addNotification } = useNotification();

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: null, success: false }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, loading: false, error: null, success: true }));
  }, []);

  const setError = useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setState(prev => ({ ...prev, error: errorObj, loading: false, success: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false,
    });
  }, [initialData]);

  const executeAsync = useCallback(
    async <R = T>(
      asyncFn: () => Promise<R>,
      options: ApiOptions = {}
    ): Promise<R | null> => {
      const {
        onSuccess,
        onError,
        showSuccessNotification = false,
        showErrorNotification = true,
        successMessage = 'Operation completed successfully',
        errorMessage = 'An error occurred',
      } = options;

      setLoading(true);

      try {
        const result = await asyncFn();
        setData(result as unknown as T);

        if (showSuccessNotification) {
          addNotification({
            type: 'success',
            title: 'Success',
            message: successMessage,
            duration: 3000,
          });
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (showErrorNotification) {
          addNotification({
            type: 'error',
            title: 'Error',
            message: errorMessage,
            duration: 5000,
          });
        }

        if (onError) {
          onError(error);
        }

        return null;
      }
    },
    [setLoading, setData, setError, addNotification]
  );

  return {
    ...state,
    setLoading,
    setData,
    setError,
    reset,
    executeAsync,
  };
}

// Specialized hook for form submissions
export function useFormSubmission<TData = any, TResult = any>() {
  const apiState = useApiState<TResult>();

  const submit = useCallback(
    async (
      data: TData,
      submitFn: (data: TData) => Promise<TResult>,
      options: ApiOptions = {}
    ) => {
      return apiState.executeAsync(
        () => submitFn(data),
        {
          showSuccessNotification: true,
          successMessage: 'Form submitted successfully',
          errorMessage: 'Failed to submit form',
          ...options,
        }
      );
    },
    [apiState]
  );

  return {
    ...apiState,
    submit,
    isSubmitting: apiState.loading,
  };
}

// Hook for data fetching with retry capability
export function useDataFetching<T = any>(initialData: T | null = null) {
  const apiState = useApiState<T>(initialData);
  const [retryCount, setRetryCount] = useState(0);

  const fetch = useCallback(
    async (
      fetchFn: () => Promise<T>,
      options: ApiOptions & { maxRetries?: number } = {}
    ) => {
      const { maxRetries = 3, ...restOptions } = options;

      const attemptFetch = async (attempt: number): Promise<T | null> => {
        try {
          return await apiState.executeAsync(fetchFn, {
            showErrorNotification: attempt >= maxRetries,
            ...restOptions,
          });
        } catch (error) {
          if (attempt < maxRetries) {
            setRetryCount(attempt + 1);
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptFetch(attempt + 1);
          }
          throw error;
        }
      };

      setRetryCount(0);
      return attemptFetch(0);
    },
    [apiState]
  );

  const retry = useCallback(
    (fetchFn: () => Promise<T>, options?: ApiOptions) => {
      return fetch(fetchFn, options);
    },
    [fetch]
  );

  return {
    ...apiState,
    fetch,
    retry,
    retryCount,
    canRetry: retryCount < 3,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T = any>(initialData: T | null = null) {
  const [optimisticData, setOptimisticData] = useState<T | null>(initialData);
  const apiState = useApiState<T>(initialData);

  const executeOptimistic = useCallback(
    async (
      optimisticValue: T,
      updateFn: () => Promise<T>,
      options: ApiOptions = {}
    ) => {
      // Set optimistic value immediately
      setOptimisticData(optimisticValue);

      try {
        const result = await apiState.executeAsync(updateFn, options);
        setOptimisticData(result);
        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticData(apiState.data);
        throw error;
      }
    },
    [apiState]
  );

  return {
    ...apiState,
    data: optimisticData ?? apiState.data,
    executeOptimistic,
  };
}