/**
 * Generic Form Date Picker Component
 * Integrates react-hook-form with MUI TextField for date input
 */

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormDatePickerProps<T extends FieldValues> extends Omit<TextFieldProps, 'name' | 'control' | 'type'> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
}

export default function FormDatePicker<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  ...textFieldProps
}: FormDatePickerProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Convert Date to string for input, or keep string as is
        const value = field.value instanceof Date 
          ? field.value.toISOString().split('T')[0]
          : field.value || '';

        return (
          <TextField
            {...field}
            {...textFieldProps}
            type="date"
            fullWidth
            value={value}
            onChange={(e) => {
              const dateValue = e.target.value;
              // Convert string to Date if needed, or keep as string
              field.onChange(dateValue ? new Date(dateValue) : null);
            }}
            label={
              label ? (
                <span>
                  {label} {required && <span style={{ color: 'red' }}> *</span>}
                </span>
              ) : undefined
            }
            error={!!error}
            helperText={error?.message}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' },
              ...textFieldProps.sx,
            }}
          />
        );
      }}
    />
  );
}

