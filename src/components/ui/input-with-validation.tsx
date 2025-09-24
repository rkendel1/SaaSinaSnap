'use client';

import { forwardRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';

import { cn } from '@/utils/cn';
import { useRealTimeValidation, type ValidationResult } from '@/utils/validation';

import { Input } from './input';

export interface InputWithValidationProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validator?: (value: string) => ValidationResult;
  showValidationIcon?: boolean;
  validationDelay?: number;
  label?: string;
  errorMessage?: string;
  successMessage?: string;
}

const InputWithValidation = forwardRef<HTMLInputElement, InputWithValidationProps>(
  (
    {
      className,
      validator,
      showValidationIcon = true,
      validationDelay = 300,
      label,
      errorMessage,
      successMessage,
      onChange,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState(props.defaultValue?.toString() || '');
    const [touched, setTouched] = useState(false);

    const { isValid, error, isValidating } = useRealTimeValidation(
      value,
      validator || (() => ({ isValid: true })),
      validationDelay
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      if (!touched) setTouched(true);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      props.onBlur?.(e);
    };

    const showError = touched && !isValid && error;
    const showSuccess = touched && isValid && value.length > 0 && !isValidating;
    const displayError = errorMessage || error;
    const hasValidation = validator && showValidationIcon;

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={props.id} className="text-sm font-medium">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              className,
              hasValidation && 'pr-10',
              showError && 'border-destructive focus-visible:ring-destructive',
              showSuccess && 'border-green-500 focus-visible:ring-green-500'
            )}
            {...props}
          />
          {hasValidation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!isValidating && showError && <X className="h-4 w-4 text-destructive" />}
              {!isValidating && showSuccess && <Check className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>
        {showError && (
          <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 duration-200">
            {displayError}
          </p>
        )}
        {showSuccess && successMessage && (
          <p className="text-sm text-green-600 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

InputWithValidation.displayName = 'InputWithValidation';

export { InputWithValidation };