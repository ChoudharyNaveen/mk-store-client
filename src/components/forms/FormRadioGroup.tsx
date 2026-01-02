/**
 * Generic Form Radio Group Component
 * Integrates react-hook-form with MUI RadioGroup
 */

import React from 'react';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, FormHelperText, Typography, Box } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface RadioOption {
  value: string | number;
  label: string;
}

interface FormRadioGroupProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
  options: RadioOption[];
  row?: boolean;
  helperText?: string;
}

export default function FormRadioGroup<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  options,
  row = false,
  helperText,
}: FormRadioGroupProps<T>) {
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
          <FormControl error={!!error} fullWidth>
            {label && <FormLabel>{label}</FormLabel>}
            <RadioGroup {...field} row={row}>
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {(error || helperText) && (
              <FormHelperText>{error?.message || helperText}</FormHelperText>
            )}
          </FormControl>
        </Box>
      )}
    />
  );
}

