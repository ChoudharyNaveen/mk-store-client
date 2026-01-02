/**
 * Generic Form Switch Component
 * Integrates react-hook-form with MUI Switch
 */

import React from 'react';
import { FormControlLabel, Switch, SwitchProps, Typography, Box, FormHelperText } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormSwitchProps<T extends FieldValues> extends Omit<SwitchProps, 'name' | 'control'> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  helperText?: string;
}

export default function FormSwitch<T extends FieldValues>({
  name,
  control,
  label,
  helperText,
  ...switchProps
}: FormSwitchProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ...field }, fieldState: { error } }) => (
        <Box>
          <FormControlLabel
            control={
              <Switch
                {...field}
                {...switchProps}
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

