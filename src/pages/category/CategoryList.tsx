
import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Avatar, Paper, Select, MenuItem, FormControl, InputLabel, Tooltip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataTable from '../../components/DataTable';
import DateRangePopover from '../../components/DateRangePopover';
import type { DateRangeSelection } from '../../components/DateRangePopover';
import StatusToggleButton from '../../components/StatusToggleButton';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchCategories, updateCategory } from '../../services/category.service';
import type { Category } from '../../types/category';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';
import { CATEGORY_STATUS_OPTIONS } from '../../constants/statusOptions';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function CategoryPage() {
    const navigate = useNavigate();

    const dispatch = useAppDispatch();

    // Get vendorId and branchId from store
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;

    // Get date range from store, or use default
    const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
    const storeEndDate = useAppSelector((state) => state.dateRange.endDate);

    const [updatingCategoryId, setUpdatingCategoryId] = React.useState<number | null>(null);
    const refreshTableRef = React.useRef<() => void>(() => {});

    const handleToggleStatus = React.useCallback(async (row: Category) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const concurrencyStamp = row.concurrencyStamp ?? (row as Category & { concurrency_stamp?: string }).concurrency_stamp ?? '';
        if (!concurrencyStamp) {
            showErrorToast('Cannot toggle: missing concurrency stamp.');
            return;
        }
        const userId = user?.id;
        if (userId == null) {
            showErrorToast('User not found.');
            return;
        }
        setUpdatingCategoryId(row.id);
        try {
            await updateCategory(row.id, {
                title: row.title,
                description: row.description ?? '',
                updatedBy: userId,
                concurrencyStamp,
                status: newStatus,
            });
            showSuccessToast(`Category set to ${newStatus}.`);
            refreshTableRef.current();
        } catch {
            showErrorToast('Failed to update category status.');
        } finally {
            setUpdatingCategoryId(null);
        }
    }, [user?.id]);

    const columns = [
        {
            id: 'image' as keyof Category,
            label: 'Image',
            minWidth: 80,
            render: (row: Category) => (
                <Avatar
                    src={row.image}
                    alt={row.title}
                    variant="rounded"
                    sx={{ width: 50, height: 50 }}
                />
            )
        },
        {
            id: 'title' as keyof Category,
            label: 'Category',
            minWidth: 150,
            render: (row: Category) => (
                <Typography
                    component="button"
                    onClick={() => navigate(`/category/detail/${row.id}`)}
                    sx={{
                        background: 'none',
                        border: 'none',
                        color: '#204564',
                        cursor: 'pointer',
                        textAlign: 'left',
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    {row.title}
                </Typography>
            )
        },
        { id: 'description' as keyof Category, label: 'Description', minWidth: 200 },
        { id: 'status' as keyof Category, label: 'Status', minWidth: 100 },
        {
            id: 'action' as keyof Category,
            label: 'Action',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Category) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/category/detail/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' }
                        }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/category/edit/${row.id}`)}
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
                        disabled={updatingCategoryId === row.id}
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

    type AdvancedFiltersState = { categoryName: string; status: string };
    const emptyAdvancedFilters: AdvancedFiltersState = { categoryName: '', status: '' };

    const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);

    // Helper function to build filters array with date range and applied advanced filters only
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: {
                categoryName: appliedAdvancedFilters.categoryName || undefined,
                status: appliedAdvancedFilters.status || undefined,
            },
            filterMappings: {
                categoryName: { field: 'title', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
            },
        });

        // Merge with default filters (vendorId and branchId)
        return mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
    }, [dateRange, appliedAdvancedFilters, vendorId, selectedBranchId]);

    // Use server pagination hook - now includes tableState and tableHandlers
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        fetchData,
        tableState,
        tableHandlers,
    } = useServerPagination<Category>({
        fetchFunction: fetchCategories,
        initialPageSize: 20,
        enabled: true,
        autoFetch: false,
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

    const fetchDataRef = React.useRef(fetchData);
    fetchDataRef.current = fetchData;

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

    // Fetch only when applied advanced filters change (date range fetch happens on DateRangePopover Apply)
    React.useEffect(() => {
        const range = dateRange?.[0];
        const hasValidDateRange =
            range?.startDate && range?.endDate &&
            !isNaN(new Date(range.startDate).getTime()) &&
            !isNaN(new Date(range.endDate).getTime());
        if (!hasValidDateRange) return;

        const newFilters = buildFilters();
        setFilters(newFilters);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        fetchDataRef.current({ initialFetch: true, filters: newFilters });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when applied filters change; date range applied on picker close
    }, [appliedAdvancedFilters]);

    React.useEffect(() => {
        if (filterAnchorEl) {
            setAdvancedFilters(appliedAdvancedFilters);
        }
    }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplyFilters = () => {
        const pending = advancedFilters;
        setAppliedAdvancedFilters(pending);
        const advancedFiltersForBuild: Record<string, string | undefined> = {
            categoryName: pending.categoryName || undefined,
            status: pending.status || undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: advancedFiltersForBuild,
            filterMappings: {
                categoryName: { field: 'title', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
            },
        });
        const filtersToApply = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
        setFilters(filtersToApply);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilterAnchorEl(null);
    };

    const handleClearFilters = () => {
        setAdvancedFilters(emptyAdvancedFilters);
        setAppliedAdvancedFilters(emptyAdvancedFilters);
        const emptyForBuild: Record<string, string | undefined> = {
            categoryName: undefined,
            status: undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: emptyForBuild,
            filterMappings: {
                categoryName: { field: 'title', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
            },
        });
        const filtersToApply = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
        setFilters(filtersToApply);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilterAnchorEl(null);
        fetchData({ force: true, initialFetch: true, filters: filtersToApply });
    };

    const handleDateRangeApply = (newRange: DateRangeSelection) => {
        setDateRange(newRange);
        const range = newRange?.[0];
        if (range) {
            dispatch(setDateRangeAction({
                startDate: range.startDate,
                endDate: range.endDate,
            }));
        }
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange: newRange,
            dateField: 'createdAt',
            advancedFilters: {
                categoryName: appliedAdvancedFilters.categoryName || undefined,
                status: appliedAdvancedFilters.status || undefined,
            },
            filterMappings: {
                categoryName: { field: 'title', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
            },
        });
        const newFilters = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
        setFilters(newFilters);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        fetchDataRef.current({ force: true, initialFetch: true, filters: newFilters });
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 , borderRadius: 1 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Categories
                </Typography>
                <Link to="/category/new" style={{ textDecoration: 'none' }}>
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
                        Add Category
                    </Button>
                </Link>
            </Box>

            {/* Unified Container for Search, Filters and Table */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
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
                        id="category-search"
                        placeholder="Search categories..."
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
                        <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Categories</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            label="Category Name"
                            value={advancedFilters.categoryName}
                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, categoryName: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={advancedFilters.status}
                                label="Status"
                                onChange={(e) => setAdvancedFilters({ categoryName: advancedFilters.categoryName, status: e.target.value })}
                            >
                                <MenuItem value="">All</MenuItem>
                                {CATEGORY_STATUS_OPTIONS.map((option) => (
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
                        key={`category-table-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns}
                        state={tableState}
                        handlers={tableHandlers}
                    />
                </Box>
            </Box>
        </Paper>
    );
}

