import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, TextField, SxProps, Popper } from '@mui/material';
import styled from '@emotion/styled';

const get = (obj: any, path: string, defaultValue?: any) => {
    return path
        .replace(/\[(\w+)\]/g, '.$1')
        .replace(/^\./, '')
        .split('.')
        .reduce((acc, curr) => (acc && acc[curr] !== undefined ? acc[curr] : undefined), obj) ?? defaultValue;
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
    isOptionEqualToValue?: (option: any, value: any) => boolean;
    filterOptions?: (options: any[], state: { inputValue: string }) => any[];
    onChange?: (event: React.SyntheticEvent, value: any) => void;
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
    const error = get(formState.errors, name);

    const defaultIsOptionEqualToValue = (option: any, value: any) => {
        return option?.value === value?.value || option?.value === value;
    };

    const defaultFilterOptions = (options: any[], { inputValue }: { inputValue: string }) => {
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
                    <Autocomplete
                        options={options}
                        getOptionLabel={(option) => option.label || option.value?.toString() || ''}
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

