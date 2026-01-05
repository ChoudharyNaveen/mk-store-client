/**
 * Generic Form TextArea Component
 * Integrates react-hook-form with MUI TextField (multiline)
 */

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormTextAreaProps<T extends FieldValues> extends Omit<TextFieldProps, 'name' | 'control'> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
  rows?: number;
}

export default function FormTextArea<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  rows = 4,
  ...textFieldProps
}: FormTextAreaProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          fullWidth
          multiline
          rows={rows}
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

