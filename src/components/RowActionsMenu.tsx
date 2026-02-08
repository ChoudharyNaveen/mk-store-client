import React from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export type RowActionItem<T = unknown> =
  | {
      type: 'item';
      label: string;
      icon?: React.ReactNode;
      onClick: (row: T) => void;
      disabled?: boolean;
    }
  | { type: 'divider' };

export interface RowActionsMenuProps<T> {
  /** The row data (passed to items builder and to onClick) */
  row: T;
  /** Function that returns the list of menu items (and optional dividers) for this row */
  items: (row: T) => RowActionItem<T>[];
  /** Optional aria-label for the trigger button */
  ariaLabel?: string;
  /** Optional min width for the menu paper */
  menuMinWidth?: number;
}

export default function RowActionsMenu<T>({
  row,
  items,
  ariaLabel = 'Open actions menu',
  menuMinWidth = 180,
}: RowActionsMenuProps<T>) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = items(row);

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        aria-label={ariaLabel}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: menuMinWidth } }}
      >
        {menuItems.map((item, index) =>
          item.type === 'divider' ? (
            <Divider key={`divider-${index}`} />
          ) : (
            <MenuItem
              key={`${item.label}-${index}`}
              onClick={() => {
                item.onClick(row);
                handleClose();
              }}
              disabled={item.disabled}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          )
        )}
      </Menu>
    </>
  );
}
