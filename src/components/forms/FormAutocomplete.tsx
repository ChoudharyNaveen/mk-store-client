import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, TextField, SxProps, Popper } from '@mui/material';
import styled from '@emotion/styled';

const get = (obj: unknown, path: string, defaultValue?: unknown): unknown => {
    if (!obj || typeof obj !== 'object') return defaultValue;
    return path
        .replace(/\[(\w+)\]/g, '.$1')
        .replace(/^\./, '')
        .split('.')
        .reduce((acc, curr) => {
            if (acc && typeof acc === 'object' && curr in acc) {
                return (acc as Record<string, unknown>)[curr];
            }
            return undefined;
        }, obj as Record<string, unknown>) ?? defaultValue;
};

const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: 200,
        overflowY: 'auto',
    },
});

export interface FormAutocompleteProps {
    name: string;
    options: Array<{ value: string | number; label: string }>;
    label?: string;
    required?: boolean;
    size?: 'small' | 'medium';
    fullWidth?: boolean;
    sx?: SxProps;
    disabled?: boolean;
    placeholder?: string;
    noOptionsText?: string;
    isOptionEqualToValue?: (
        option: { value: string | number; label: string },
        value: { value: string | number; label: string } | string | number | null
    ) => boolean;
    filterOptions?: (
        options: Array<{ value: string | number; label: string }>,
        state: { inputValue: string }
    ) => Array<{ value: string | number; label: string }>;
    onChange?: (
        event: React.SyntheticEvent,
        value: { value: string | number; label: string } | null
    ) => void;
    onInputChange?: (event: React.SyntheticEvent, value: string, reason: string) => void;
    inputValue?: string;
    loading?: boolean;
}

const FormAutocomplete: React.FC<FormAutocompleteProps> = ({
    name,
    options,
    label,
    required = false,
    size = 'small',
    fullWidth = true,
    sx,
    disabled = false,
    placeholder,
    noOptionsText = 'No options',
    isOptionEqualToValue,
    filterOptions,
    onChange,
    onInputChange,
    inputValue,
    loading = false,
}) => {
    const { control, formState } = useFormContext();
    const error = get(formState.errors, name) as { message?: string } | undefined;

    const defaultIsOptionEqualToValue = (
        option: { value: string | number; label: string },
        value: { value: string | number; label: string } | string | number | null
    ): boolean => {
        if (!value) return false;
        if (typeof value === 'object' && 'value' in value) {
            return option?.value === value?.value;
        }
        return option?.value === value;
    };

    const defaultFilterOptions = (
        options: Array<{ value: string | number; label: string }>,
        { inputValue }: { inputValue: string }
    ): Array<{ value: string | number; label: string }> => {
        if (!inputValue) return options;
        const lowercase = inputValue.toLowerCase();
        return options.filter((option) => {
            const label = option.label || option.value || '';
            return label.toString().toLowerCase().includes(lowercase);
        });
    };

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const selectedOption = options.find(
                    (option) => option.value === field.value || option.value === (field.value?.value ?? field.value)
                ) || null;

                return (
                    <Autocomplete<{ value: string | number; label: string }>
                        options={options}
                        getOptionLabel={(option) => option.label || String(option.value) || ''}
                        value={selectedOption}
                        isOptionEqualToValue={isOptionEqualToValue || defaultIsOptionEqualToValue}
                        onChange={(event, newValue) => {
                            const valueToSet = newValue ? newValue.value : '';
                            field.onChange(valueToSet);
                            if (onChange) {
                                onChange(event, newValue);
                            }
                        }}
                        onInputChange={onInputChange}
                        inputValue={inputValue}
                        loading={loading}
                        disabled={disabled}
                        fullWidth={fullWidth}
                        size={size}
                        filterOptions={filterOptions || defaultFilterOptions}
                        PopperComponent={(props) => <StyledPopper {...props} />}
                        noOptionsText={noOptionsText}
                        autoComplete={false}
                        sx={sx}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={
                                    label ? (
                                        <span>
                                            {label} {required && <span style={{ color: 'red' }}> *</span>}
                                        </span>
                                    ) : undefined
                                }
                                placeholder={placeholder}
                                error={!!error}
                                helperText={error?.message as string | undefined}
                                autoComplete="off"
                                slotProps={{
                                    inputLabel: { shrink: true },
                                }}
                            />
                        )}
                    />
                );
            }}
        />
    );
};

export default FormAutocomplete;

