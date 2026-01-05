/**
 * Generic Form Autocomplete Component
 * Integrates react-hook-form with MUI Autocomplete
 */

import React from 'react';
import { Autocomplete, TextField, AutocompleteProps, Typography, Box, Popper, SxProps } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import styled from '@emotion/styled';

const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: 200,
        overflowY: 'auto',
    },
});

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
  placeholder?: string;
  noOptionsText?: string;
  sx?: SxProps;
}

export default function FormAutocomplete<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  options,
  getOptionLabel = (option) => option.label,
  isOptionEqualToValue,
  placeholder,
  noOptionsText = 'No options',
  sx,
  ...autocompleteProps
}: FormAutocompleteProps<T>) {
  const defaultIsOptionEqualToValue = (option: AutocompleteOption, value: AutocompleteOption | null) => {
    if (!value) return false;
    return option?.value === value?.value;
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ...field }, fieldState: { error } }) => {
        const selectedOption = options.find(
          (opt) => {
            if (value === null || value === undefined) return false;
            // Handle both direct value match and nested value match
            const valueToCompare = typeof value === 'object' && 'value' in value ? (value as { value: string | number }).value : value;
            return opt.value === valueToCompare;
          }
        ) || null;
        
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
              onChange={(event, newValue) => {
                const valueToSet = newValue ? newValue.value : null;
                onChange(valueToSet);
              }}
              onInputChange={(_, newInputValue, reason) => {
                // Clear the value when input is cleared or when user starts typing (editing the selected value)
                if (reason === 'clear') {
                  onChange(null);
                } else if (reason === 'input' && selectedOption) {
                  // When user types and there's a selected value, check if input differs from selected label
                  const selectedLabel = getOptionLabel(selectedOption);
                  if (newInputValue !== selectedLabel) {
                    // User is editing - clear the selection to allow free typing
                    onChange(null);
                  }
                }
                // Call the original onInputChange if provided
                if (autocompleteProps.onInputChange) {
                  autocompleteProps.onInputChange(_, newInputValue, reason);
                }
              }}
              getOptionLabel={getOptionLabel}
              isOptionEqualToValue={isOptionEqualToValue || defaultIsOptionEqualToValue}
              clearOnBlur={false}
              disableClearable={false}
              selectOnFocus={false}
              autoComplete={false}
              freeSolo={false}
              clearOnEscape={true}
              noOptionsText={noOptionsText}
              PopperComponent={(props) => <StyledPopper {...props} />}
              sx={sx}
              renderInput={(params) => {
                const { InputProps, inputProps, ...textFieldParams } = params;
                return (
                  <TextField
                    {...textFieldParams}
                    placeholder={placeholder}
                    inputProps={{
                      ...inputProps,
                      autoComplete: 'off',
                      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                        // Handle backspace when a value is selected
                        if (e.key === 'Backspace' && selectedOption) {
                          const input = e.currentTarget as HTMLInputElement;
                          const cursorPos = input.selectionStart || 0;
                          const currentInputValue = input.value || '';
                          const selectedLabel = getOptionLabel(selectedOption);
                          const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
                          
                          // Only clear the selection if:
                          // 1. All text is selected, OR
                          // 2. Cursor is at position 0 (start) and input exactly matches selected label
                          if (isAllSelected || (cursorPos === 0 && currentInputValue === selectedLabel)) {
                            e.preventDefault();
                            e.stopPropagation();
                            // Clear the form value to allow editing
                            onChange(null);
                            // Focus the input after clearing
                            setTimeout(() => {
                              input.focus();
                              // Clear the input value directly
                              input.value = '';
                            }, 0);
                            return;
                          }
                          // Otherwise, let normal backspace behavior work (delete one character)
                          // This will trigger onInputChange which will clear the selection if needed
                        }
                        // Call the original onKeyDown if provided
                        if (inputProps?.onKeyDown) {
                          inputProps.onKeyDown(e as React.KeyboardEvent<HTMLInputElement>);
                        }
                      },
                    }}
                    InputProps={InputProps}
                    error={!!error}
                    helperText={error?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' },
                    }}
                  />
                );
              }}
            />
          </Box>
        );
      }}
    />
  );
}

