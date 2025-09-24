"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';

import { cn } from '@/utils/cn';
import { useRealTimeValidation, ValidationResult } from '@/utils/validation';

export interface InputWithValidationProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  validator: (value: string) => ValidationResult;
  label?: string;
  successMessage?: string;
  onValidationChange?: (isValid: boolean) => void; // New prop
}

const InputWithValidation = React.forwardRef<
  HTMLInputElement,
  InputWithValidationProps
>(
  (
    {
      className,
      type,
      label,
      validator,
      successMessage,
      onValidationChange, // Destructure new prop
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState((props.value as string) || '');
    const { isValid, error, isValidating } = useRealTimeValidation(value, validator);

    // Call onValidationChange when validation status changes
    useEffect(() => {
      if (onValidationChange) {
        onValidationChange(isValid);
      }
    }, [isValid, onValidationChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const showSuccess = isValid && !isValidating && value.length > 0;
    const showError = !isValid && !isValidating && value.length > 0;
    const showValidating = isValidating && value.length > 0;

    return (
      <div className="relative space-y-2">
        {label && (
          <label htmlFor={props.id || props.name} className="text-sm font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              showError && 'border-destructive focus-visible:ring-destructive',
              showSuccess && 'border-green-500 focus-visible:ring-green-500',
              className
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            {...props}
          />
          <div className="absolute inset-y-0 right-3 flex items-center">
            {showValidating && (
              <CircleDashed className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {showError && <XCircle className="h-4 w-4 text-destructive" />}
            {showSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
        </div>
        {showError && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {showSuccess && successMessage && (
          <p className="text-sm text-green-500">{successMessage}</p>
        )}
      </div>
    );
  }
);
InputWithValidation.displayName = "InputWithValidation";

export { InputWithValidation };