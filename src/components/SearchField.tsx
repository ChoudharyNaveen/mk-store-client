import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  type TextFieldProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export interface SearchFieldProps
  extends Omit<TextFieldProps, 'value' | 'onChange' | 'InputProps'> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAndRefresh: () => void;
  sx?: SxProps<Theme>;
}

export default function SearchField({
  value,
  onChange,
  onClearAndRefresh,
  placeholder = 'Search...',
  size = 'small',
  variant = 'outlined',
  sx,
  ...rest
}: SearchFieldProps) {
  const handleClear = () => {
    onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    onClearAndRefresh();
  };

  return (
    <TextField
      placeholder={placeholder}
      variant={variant}
      size={size}
      value={value}
      onChange={onChange}
      sx={{
        flex: 1,
        minWidth: 220,
        maxWidth: 400,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          bgcolor: 'background.default',
        },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary' }} fontSize={size === 'small' ? 'small' : undefined} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={handleClear}
              edge="end"
              aria-label="Clear search"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      {...rest}
    />
  );
}
