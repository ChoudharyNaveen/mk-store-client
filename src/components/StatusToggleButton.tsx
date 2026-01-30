import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

export type ToggleStatus = 'ACTIVE' | 'INACTIVE';

export interface StatusToggleButtonProps {
  status: ToggleStatus;
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Reusable button to toggle entity status between ACTIVE and INACTIVE.
 * Used in list pages (Category, SubCategory, Brand, Banner, Offer, Promocode).
 */
export default function StatusToggleButton({
  status,
  onClick,
  disabled = false,
  size = 'small',
}: StatusToggleButtonProps) {
  const isActive = status === 'ACTIVE';
  return (
    <Tooltip title={isActive ? 'Set to Inactive' : 'Set to Active'}>
      <span>
        <IconButton
          size={size}
          onClick={onClick}
          disabled={disabled}
          sx={{
            border: '1px solid',
            borderColor: isActive ? 'success.main' : '#e0e0e0',
            borderRadius: 2,
            color: isActive ? 'success.main' : 'text.secondary',
            bgcolor: isActive ? 'success.light' : 'transparent',
            '&:hover': {
              bgcolor: isActive ? 'success.main' : 'action.hover',
              color: isActive ? 'white' : 'text.secondary',
              borderColor: isActive ? 'success.dark' : 'primary.main',
            },
            '&:active': {
              bgcolor: isActive ? 'success.dark' : 'action.selected',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              borderColor: 'action.disabled',
              color: 'action.disabled',
            },
          }}
        >
          {isActive ? (
            <ToggleOnIcon fontSize={size} />
          ) : (
            <ToggleOffIcon fontSize={size} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
