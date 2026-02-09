import React from 'react';
import { Box, Typography, Button, Paper, IconButton, Popover, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchField from './SearchField';
import DateRangePopover from './DateRangePopover';
import type { DateRangeSelection } from './DateRangePopover';

export interface ListPageLayoutProps {
    /** Page title (e.g. "Brands", "Products") */
    title: string;
    /** Optional primary action: link and label (e.g. Add Brand) */
    addButton?: { to: string; label: string };
    /** Search input id (e.g. "brands-search") */
    searchId: string;
    /** Search placeholder */
    searchPlaceholder: string;
    /** Controlled search value */
    searchValue: string;
    /** Search change handler */
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** Called when user clears search (clear + refresh) */
    onClearAndRefresh: () => void;
    /** Current date range for picker */
    dateRange: DateRangeSelection;
    /** When user applies a new date range */
    onDateRangeChange: (range: DateRangeSelection) => void;
    /** Refresh table handler */
    onRefresh: () => void;
    /** Filter popover anchor (null when closed) */
    filterAnchorEl: HTMLElement | null;
    /** Open filter popover (pass event from Advanced Search button) */
    onOpenFilterClick: (event: React.MouseEvent<HTMLElement>) => void;
    /** Close filter popover */
    onFilterClose: () => void;
    /** Title inside the filter popover (e.g. "Filter Brands") */
    filterPopoverTitle?: string;
    /** Optional width for the filter popover content box (default 300) */
    filterPopoverWidth?: number;
    /** Content of the filter popover (form fields + Clear/Apply buttons) */
    filterPopoverContent: React.ReactNode;
    /** Optional content rendered inside the container above the toolbar (e.g. CustomTabs) */
    contentBeforeToolbar?: React.ReactNode;
    /** Table section (e.g. DataTable wrapped in Box) */
    children: React.ReactNode;
}

const toolbarSx = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 2,
    p: 2.5,
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
};

const containerSx = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 1,
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
};

const addButtonSx = {
    bgcolor: 'primary.main',
    '&:hover': { bgcolor: 'primary.dark' },
    textTransform: 'none',
    px: 3,
    borderRadius: 2,
    boxShadow: 2,
};

const filterButtonSx = {
    borderRadius: 2,
    textTransform: 'none',
    borderColor: 'divider',
    color: 'text.secondary',
    '&:hover': {
        borderColor: 'primary.main',
        bgcolor: 'action.hover',
    },
};

const refreshButtonSx = {
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    color: 'text.secondary',
    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover', color: 'primary.main' },
};

/**
 * Shared layout for list pages: header (title + optional Add), toolbar (search, date range, refresh, advanced search), filter popover, and table area.
 */
export default function ListPageLayout({
    title,
    addButton,
    searchId,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    onClearAndRefresh,
    dateRange,
    onDateRangeChange,
    onRefresh,
    filterAnchorEl,
    onOpenFilterClick,
    onFilterClose,
    filterPopoverTitle = 'Advanced Search',
    filterPopoverWidth = 300,
    filterPopoverContent,
    contentBeforeToolbar,
    children,
}: ListPageLayoutProps) {
    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {title}
                </Typography>
                {addButton && (
                    <Link to={addButton.to} style={{ textDecoration: 'none' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={addButtonSx}
                        >
                            {addButton.label}
                        </Button>
                    </Link>
                )}
            </Box>

            <Box sx={containerSx}>
                {contentBeforeToolbar}
                <Box sx={toolbarSx}>
                    <SearchField
                        id={searchId}
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={onSearchChange}
                        onClearAndRefresh={onClearAndRefresh}
                        sx={{ flex: 1, minWidth: 280, maxWidth: 400 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <DateRangePopover
                            value={dateRange}
                            onChange={onDateRangeChange}
                            moveRangeOnFirstSelection={false}
                        />
                        <Tooltip title="Refresh table">
                            <IconButton
                                onClick={onRefresh}
                                size="small"
                                sx={refreshButtonSx}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="outlined"
                            startIcon={<FilterListIcon />}
                            onClick={onOpenFilterClick}
                            sx={filterButtonSx}
                        >
                            Advanced Search
                        </Button>
                    </Box>
                </Box>

                <Popover
                    open={Boolean(filterAnchorEl)}
                    anchorEl={filterAnchorEl}
                    onClose={onFilterClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Box sx={{ p: 3, width: filterPopoverWidth }}>
                        <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                            {filterPopoverTitle}
                        </Typography>
                        {filterPopoverContent}
                    </Box>
                </Popover>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {children}
                </Box>
            </Box>
        </Paper>
    );
}
