/**
 * Generic Form Checkbox Component
 * Integrates react-hook-form with MUI Checkbox
 */

import React from 'react';
import { FormControlLabel, Checkbox, CheckboxProps, Box, FormHelperText } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormCheckboxProps<T extends FieldValues> extends Omit<CheckboxProps, 'name' | 'control'> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  helperText?: string;
}

export default function FormCheckbox<T extends FieldValues>({
  name,
  control,
  label,
  helperText,
  ...checkboxProps
}: FormCheckboxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ...field }, fieldState: { error } }) => (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                {...checkboxProps}
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
              />
            }
            label={label}
          />
          {(error || helperText) && (
            <FormHelperText error={!!error} sx={{ ml: 0 }}>
              {error?.message || helperText}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
}

