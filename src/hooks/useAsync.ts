import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

export interface AsyncOptions {
  immediate?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: AsyncOptions = {}
) {
  const {
    immediate = true,
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const cancelRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const execute = useCallback(
    async (retryAttempt = 0) => {
      if (cancelRef.current) return;

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const data = await asyncFunction();

        if (cancelRef.current) return;

        setState({
          data,
          loading: false,
          error: null,
          retryCount: retryAttempt,
        });

        if (onSuccess) {
          onSuccess(data);
        }
      } catch (error) {
        if (cancelRef.current) return;

        const errorObj = error instanceof Error ? error : new Error(String(error));

        if (retryAttempt < maxRetries) {
          // Retry with exponential backoff
          const delay = retryDelay * Math.pow(2, retryAttempt);
          retryTimeoutRef.current = setTimeout(() => {
            execute(retryAttempt + 1);
          }, delay);
        } else {
          setState({
            data: null,
            loading: false,
            error: errorObj,
            retryCount: retryAttempt,
          });

          if (onError) {
            onError(errorObj);
          }
        }
      }
    },
    [asyncFunction, maxRetries, retryDelay, onSuccess, onError]
  );

  const retry = useCallback(() => {
    execute(0);
  }, [execute]);

  const reset = useCallback(() => {
    cancelRef.current = true;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
    });
    cancelRef.current = false;
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    if (immediate) {
      execute(0);
    }

    return () => {
      cancelRef.current = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, dependencies);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute: () => execute(0),
    retry,
    reset,
    canRetry: state.retryCount < maxRetries,
  };
}