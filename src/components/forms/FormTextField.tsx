/**
 * Generic Form TextField Component
 * Integrates react-hook-form with MUI TextField
 */

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormTextFieldProps<T extends FieldValues> extends Omit<TextFieldProps, 'name' | 'control'> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
}

export default function FormTextField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  ...textFieldProps
}: FormTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          fullWidth
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
      )}
    />
  );
}

