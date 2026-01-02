/**
 * Generic Form Select Component
 * Integrates react-hook-form with MUI Select
 */

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, Typography, Box, SelectProps } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormSelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps<T extends FieldValues> extends Omit<SelectProps, 'name' | 'control'> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
  options: FormSelectOption[];
}

export default function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  options,
  ...selectProps
}: FormSelectProps<T>) {
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
          <FormControl fullWidth error={!!error} size="small">
            <Select
              {...field}
              {...selectProps}
              sx={{
                borderRadius: 2,
                bgcolor: '#fdfdfd',
                ...selectProps.sx,
              }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
        </Box>
      )}
    />
  );
}

