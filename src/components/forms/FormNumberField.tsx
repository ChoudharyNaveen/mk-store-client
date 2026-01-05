/**
 * Generic Form Number Field Component
 * Integrates react-hook-form with MUI TextField for numeric input
 */

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormNumberFieldProps<T extends FieldValues> extends Omit<TextFieldProps, 'name' | 'control' | 'type'> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
}

export default function FormNumberField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  ...textFieldProps
}: FormNumberFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          type="number"
          fullWidth
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? undefined : Number(val));
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
      )}
    />
  );
}

