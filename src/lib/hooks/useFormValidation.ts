import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  hasSubmitted: boolean;
}

interface ValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceDelay?: number;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T,
  options: ValidationOptions = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceDelay = 300,
  } = options;

  const [values, setStateValues] = useState<T>(initialValues);
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: {},
    touched: {},
    isSubmitting: false,
    hasSubmitted: false,
  });

  // Debounced validation timer
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
    };
  }, [validationTimer]);

  // Validate form data
  const validateForm = useCallback((data: T): ValidationState['errors'] => {
    try {
      schema.parse(data);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return errors;
      }
      return { general: 'Validation failed' };
    }
  }, [schema]);

  // Validate single field
  const validateField = useCallback((field: string, value: any): string | null => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.shape?.[field as keyof typeof schema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  }, [schema]);

  // Debounced validation function
  const debouncedValidate = useCallback((newValues: T) => {
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    const timer = setTimeout(() => {
      const errors = validateForm(newValues);
      setValidationState(prev => ({
        ...prev,
        errors,
        isValid: Object.keys(errors).length === 0,
      }));
    }, debounceDelay);

    setValidationTimer(timer);
  }, [validateForm, debounceDelay, validationTimer]);

  // Set field value
  const setValue = useCallback((field: keyof T, value: any) => {
    const newValues = { ...values, [field]: value };
    setStateValues(newValues);

    if (validateOnChange) {
      debouncedValidate(newValues);
    }
  }, [values, validateOnChange, debouncedValidate]);

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    const updatedValues = { ...values, ...newValues };
    setStateValues(updatedValues);

    if (validateOnChange) {
      debouncedValidate(updatedValues);
    }
  }, [values, validateOnChange, debouncedValidate]);

  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    setValidationState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));

    if (validateOnBlur && validationState.touched[field as string]) {
      const fieldError = validateField(field as string, values[field]);
      setValidationState(prev => ({
        ...prev,
        errors: fieldError
          ? { ...prev.errors, [field]: fieldError }
          : { ...prev.errors, [field]: undefined },
      }));
    }
  }, [validateOnBlur, validateField, values, validationState.touched]);

  // Handle field focus
  const handleFocus = useCallback((field: keyof T) => {
    // Clear field error on focus if user hasn't submitted yet
    if (!validationState.hasSubmitted) {
      setValidationState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined },
      }));
    }
  }, [validationState.hasSubmitted]);

  // Submit form
  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<void> | void
  ) => {
    setValidationState(prev => ({
      ...prev,
      isSubmitting: true,
      hasSubmitted: true,
      touched: Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    }));

    try {
      const errors = validateForm(values);

      if (Object.keys(errors).length > 0) {
        setValidationState(prev => ({
          ...prev,
          errors,
          isValid: false,
          isSubmitting: false,
        }));
        return { success: false, errors };
      }

      // Validate with schema to get typed data
      const validatedData = schema.parse(values);

      await onSubmit(validatedData);

      setValidationState(prev => ({
        ...prev,
        isValid: true,
        isSubmitting: false,
        errors: {},
      }));

      return { success: true, data: validatedData };
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      let errors: Record<string, string> = {};

      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errors = { general: errorMessage };
      } else {
        errors = { general: errorMessage };
      }

      setValidationState(prev => ({
        ...prev,
        errors,
        isValid: false,
        isSubmitting: false,
      }));

      return { success: false, errors };
    }
  }, [values, validateForm, schema]);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues;
    setStateValues(resetValues);
    setValidationState({
      isValid: false,
      errors: {},
      touched: {},
      isSubmitting: false,
      hasSubmitted: false,
    });
  }, [initialValues]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      errors: {},
    }));
  }, []);

  // Clear specific error
  const clearError = useCallback((field: keyof T) => {
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined },
    }));
  }, []);

  // Set custom error
  const setError = useCallback((field: keyof T | 'general', message: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: message },
      isValid: false,
    }));
  }, []);

  // Get field error
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const fieldKey = field as string;
    const hasError = validationState.errors[fieldKey];
    const isTouched = validationState.touched[fieldKey];
    const hasSubmitted = validationState.hasSubmitted;

    return (isTouched || hasSubmitted) ? hasError : undefined;
  }, [validationState.errors, validationState.touched, validationState.hasSubmitted]);

  // Check if field is valid
  const isFieldValid = useCallback((field: keyof T): boolean => {
    return !getFieldError(field);
  }, [getFieldError]);

  // Get form helpers for field
  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field],
    onChange: (value: any) => setValue(field, value),
    onBlur: () => handleBlur(field),
    onFocus: () => handleFocus(field),
    error: getFieldError(field),
    isValid: isFieldValid(field),
    touched: validationState.touched[field as string] || false,
  }), [values, setValue, handleBlur, handleFocus, getFieldError, isFieldValid, validationState.touched]);

  return {
    // Form values
    values,
    setValue,
    setValues,

    // Validation state
    isValid: validationState.isValid,
    errors: validationState.errors,
    touched: validationState.touched,
    isSubmitting: validationState.isSubmitting,
    hasSubmitted: validationState.hasSubmitted,

    // Field helpers
    getFieldError,
    isFieldValid,
    getFieldProps,

    // Form actions
    handleSubmit,
    reset,
    clearErrors,
    clearError,
    setError,

    // Event handlers
    handleBlur,
    handleFocus,
  };
}