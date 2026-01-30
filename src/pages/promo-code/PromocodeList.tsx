import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Paper, Select, MenuItem, FormControl, InputLabel, Tooltip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/EditOutlined';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import DateRangePopover from '../../components/DateRangePopover';
import type { DateRangeSelection } from '../../components/DateRangePopover';
import StatusToggleButton from '../../components/StatusToggleButton';
import { useServerPagination } from '../../hooks/useServerPagination';
import promocodeService, { fetchPromocodes } from '../../services/promo-code.service';
import type { Promocode } from '../../types/promo-code';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';
import { PROMOCODE_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function PromocodeList() {
    const navigate = useNavigate();
    
    const dispatch = useAppDispatch();
    
    // Get vendorId and branchId from store
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get date range from store, or use default
    const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
    const storeEndDate = useAppSelector((state) => state.dateRange.endDate);

    const [updatingPromocodeId, setUpdatingPromocodeId] = React.useState<number | null>(null);
    const refreshTableRef = React.useRef<() => void>(() => {});

    const handleToggleStatus = React.useCallback(async (row: Promocode) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const concurrencyStamp = row.concurrency_stamp ?? (row as Promocode & { concurrencyStamp?: string }).concurrencyStamp ?? '';
        if (!concurrencyStamp) {
            showErrorToast('Cannot toggle: missing concurrency stamp.');
            return;
        }
        const userId = user?.id;
        if (userId == null) {
            showErrorToast('User not found.');
            return;
        }
        setUpdatingPromocodeId(row.id);
        try {
            await promocodeService.updatePromocode(row.id, {
                concurrency_stamp: concurrencyStamp,
                status: newStatus,
                updated_by: userId,
            });
            showSuccessToast(`Promocode set to ${newStatus}.`);
            refreshTableRef.current();
        } catch {
            showErrorToast('Failed to update promocode status.');
        } finally {
            setUpdatingPromocodeId(null);
        }
    }, [user?.id]);

    const columns = [
        { id: 'type' as keyof Promocode, label: 'Type', minWidth: 100 },
        { id: 'code' as keyof Promocode, label: 'Code', minWidth: 120 },
        { id: 'percentage' as keyof Promocode, label: 'Percentage', minWidth: 100 },
        {
            id: 'start_date' as keyof Promocode,
            label: 'Start Date',
            minWidth: 120,
            render: (row: Promocode) => format(new Date(row.start_date), 'MMM dd, yyyy')
        },
        {
            id: 'end_date' as keyof Promocode,
            label: 'End Date',
            minWidth: 120,
            render: (row: Promocode) => format(new Date(row.end_date), 'MMM dd, yyyy')
        },
        { id: 'status' as keyof Promocode, label: 'Status', minWidth: 100 },
        {
            id: 'createdAt' as keyof Promocode,
            label: 'Created Date',
            minWidth: 120,
            render: (row: Promocode) => format(new Date(row.createdAt), 'MMM dd, yyyy')
        },
        {
            id: 'action' as keyof Promocode,
            label: 'Action',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Promocode) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/promo-code/edit/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' }
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <StatusToggleButton
                        status={row.status}
                        onClick={() => handleToggleStatus(row)}
                        disabled={updatingPromocodeId === row.id}
                    />
                </Box>
            )
        },
    ];

    const [dateRange, setDateRange] = React.useState<DateRangeSelection>(() => {
        if (storeStartDate && storeEndDate) {
            return [{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }];
        }
        return getLastNDaysRangeForDatePicker(30);
    });
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const [advancedFilters, setAdvancedFilters] = React.useState({
        code: '',
        type: '',
        status: '',
    });

    // Helper function to build filters array with date range and default filters
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters,
            filterMappings: {
                code: { field: 'code', operator: 'iLike' },
                type: { field: 'type', operator: 'eq' },
                status: { field: 'status', operator: 'eq' },
            },
        });
        
        // Merge with default filters (vendorId and branchId)
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, advancedFilters, vendorId, selectedBranchId]);

    // Use server pagination hook - now includes tableState and tableHandlers
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        tableState,
        tableHandlers,
    } = useServerPagination<Promocode>({
        fetchFunction: fetchPromocodes,
        initialPageSize: 10,
        enabled: true,
        autoFetch: true,
        filters: buildFilters(),
        initialSorting: [
            {
                key: 'createdAt',
                direction: 'DESC',
            },
        ],
        searchDebounceMs: 500,
    });

    refreshTableRef.current = tableHandlers.refresh;

    // Sync local date range with store when store dates change
    React.useEffect(() => {
        if (storeStartDate && storeEndDate) {
            setDateRange([{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }]);
        }
    }, [storeStartDate, storeEndDate]);

    // Update filters when advanced filters or date range changes
    React.useEffect(() => {
        setFilters(buildFilters());
        // Reset to first page when filters change
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [advancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    const handleApplyFilters = () => {
        setFilterAnchorEl(null);
        tableHandlers.refresh();
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ code: '', type: '', status: '' });
        tableHandlers.refresh();
    };

    const handleDateRangeApply = (newRange: DateRangeSelection) => {
        setDateRange(newRange);
        const range = newRange?.[0];
        if (range) {
            dispatch(setDateRangeAction({ startDate: range.startDate, endDate: range.endDate }));
        }
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Promocodes
                </Typography>
                <Link to="/promo-code/new" style={{ textDecoration: 'none' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                            textTransform: 'none',
                            px: 3,
                            borderRadius: 2,
                            boxShadow: 2,
                        }}
                    >
                        Add Promocode
                    </Button>
                </Link>
            </Box>

            {/* Unified Container for Search, Filters and Table */}
            <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden'
            }}>
                {/* Search and Filter Section */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    gap: 2,
                    p: 2.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}>
                    <TextField
                        id="promocode-search"
                        placeholder="Search promocodes..."
                        variant="outlined"
                        size="small"
                        value={tableState.search}
                        onChange={tableHandlers.handleSearch}
                        sx={{
                            flex: 1,
                            minWidth: 280,
                            maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'background.default',
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <DateRangePopover
                            value={dateRange}
                            onChange={handleDateRangeApply}
                            moveRangeOnFirstSelection={false}
                        />
                        <Tooltip title="Refresh table">
                            <IconButton
                                onClick={() => tableHandlers.refresh()}
                                size="small"
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover', color: 'primary.main' },
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="outlined"
                            startIcon={<FilterListIcon />}
                            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                            sx={{ 
                                borderRadius: 2, 
                                textTransform: 'none', 
                                borderColor: 'divider', 
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            Advanced Search
                        </Button>
                    </Box>
                </Box>

            <Popover
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ p: 3, width: 300 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Promocodes</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Code"
                        value={advancedFilters.code}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, code: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Type"
                        value={advancedFilters.type}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, type: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={advancedFilters.status}
                            label="Status"
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                        >
                            <MenuItem value="">All</MenuItem>
                            {PROMOCODE_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </Box>
            </Popover>

                {/* Data Table Section */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <DataTable 
                        key={`promocode-table-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns} 
                        state={tableState} 
                        handlers={tableHandlers} 
                    />
                </Box>
            </Box>
        </Paper>
    );
}
