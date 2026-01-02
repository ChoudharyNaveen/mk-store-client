/**
 * Generic Form TextField Component
 * Integrates react-hook-form with MUI TextField
 */

import React from 'react';
import { TextField, TextFieldProps, Typography, Box } from '@mui/material';
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
        <Box>
          {label && (
            <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
              {label} {required && '*'}
            </Typography>
          )}
          <TextField
            {...field}
            {...textFieldProps}
            fullWidth
            error={!!error}
            helperText={error?.message}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' },
              ...textFieldProps.sx,
            }}
          />
        </Box>
      )}
    />
  );
}

