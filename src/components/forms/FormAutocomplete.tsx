/**
 * Generic Form Autocomplete Component
 * Integrates react-hook-form with MUI Autocomplete
 */

import React from 'react';
import { Autocomplete, TextField, AutocompleteProps, Typography, Box } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface AutocompleteOption {
  value: string | number;
  label: string;
}

interface FormAutocompleteProps<T extends FieldValues> extends Omit<AutocompleteProps<any, false, false, false>, 'name' | 'control' | 'renderInput' | 'options'> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
  options: AutocompleteOption[];
  getOptionLabel?: (option: AutocompleteOption) => string;
  isOptionEqualToValue?: (option: AutocompleteOption, value: AutocompleteOption) => boolean;
}

export default function FormAutocomplete<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  options,
  getOptionLabel = (option) => option.label,
  isOptionEqualToValue = (option, value) => option.value === value.value,
  ...autocompleteProps
}: FormAutocompleteProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ...field }, fieldState: { error } }) => {
        const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;
        
        return (
          <Box>
            {label && (
              <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
                {label} {required && '*'}
              </Typography>
            )}
            <Autocomplete
              {...field}
              {...autocompleteProps}
              options={options}
              value={selectedOption}
              onChange={(_, newValue) => {
                onChange(newValue ? newValue.value : null);
              }}
              getOptionLabel={getOptionLabel}
              isOptionEqualToValue={isOptionEqualToValue}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={!!error}
                  helperText={error?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' },
                  }}
                />
              )}
            />
          </Box>
        );
      }}
    />
  );
}

