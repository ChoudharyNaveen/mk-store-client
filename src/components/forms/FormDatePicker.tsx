/**
 * Generic Form Date Picker Component
 * Integrates react-hook-form with MUI X DatePicker
 */

import React from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface FormDatePickerProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  sx?: any;
  slotProps?: any;
  minDate?: Date;
  maxDate?: Date;
}

// Type guard to check if value is a Date
function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export default function FormDatePicker<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  disabled = false,
  size = 'small',
  variant = 'outlined',
  sx,
  slotProps,
  ...datePickerProps
}: FormDatePickerProps<T>) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => {
          // Convert value to Date or null
          let dateValue: Date | null = null;
          if (field.value) {
            if (isDate(field.value)) {
              dateValue = field.value;
            } else if (typeof field.value === 'string') {
              dateValue = new Date(field.value);
              if (isNaN(dateValue.getTime())) {
                dateValue = null;
              }
            }
          }

          return (
            <DatePicker
              {...datePickerProps}
              label={label}
              value={dateValue}
              onChange={(newValue) => {
                field.onChange(newValue);
              }}
              disabled={disabled}
              slotProps={{
                ...slotProps,
                textField: {
                  ...slotProps?.textField,
                  error: !!error,
                  helperText: error?.message,
                  required,
                  fullWidth: true,
                  size,
                  variant,
                  ...slotProps?.textField,
                },
              }}
              sx={sx}
            />
          );
        }}
      />
    </LocalizationProvider>
  );
}
