
import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Avatar, Paper, Select, MenuItem, FormControl, InputLabel, Autocomplete, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchSubCategories } from '../../services/sub-category.service';
import { fetchCategories } from '../../services/category.service';
import type { SubCategory } from '../../types/sub-category';
import type { Category } from '../../types/category';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';
import { SUBCATEGORY_STATUS_OPTIONS } from '../../constants/statusOptions';

export default function SubCategoryList() {
    const navigate = useNavigate();
    
    const dispatch = useAppDispatch();
    
    // Get vendorId and branchId from store
    const { user } = useAppSelector((state) => state.auth);
    const selectedBranchId = useAppSelector((state) => state.branch.selectedBranchId);
    const vendorId = user?.vendorId;
    
    // Get date range from store, or use default
    const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
    const storeEndDate = useAppSelector((state) => state.dateRange.endDate);
    
    const columns = [
        {
            id: 'image' as keyof SubCategory,
            label: 'Image',
            minWidth: 80,
            render: (row: SubCategory) => (
                <Avatar
                    src={row.image}
                    alt={row.title}
                    variant="rounded"
                    sx={{ width: 50, height: 50 }}
                />
            )
        },
        { 
            id: 'title' as keyof SubCategory, 
            label: 'Sub Category', 
            minWidth: 150,
            render: (row: SubCategory) => (
                <Typography
                    component="button"
                    onClick={() => navigate(`/sub-category/detail/${row.id}`)}
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
        { 
            id: 'category' as keyof SubCategory, 
            label: 'Category', 
            minWidth: 150,
            render: (row: SubCategory) => row.category?.title || 'N/A'
        },
        { id: 'description' as keyof SubCategory, label: 'Description', minWidth: 200 },
        { id: 'status' as keyof SubCategory, label: 'Status', minWidth: 100 },
        {
            id: 'action' as keyof SubCategory,
            label: 'Action',
            minWidth: 100,
            align: 'center' as const,
            render: (row: SubCategory) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/sub-category/detail/${row.id}`)}
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
                        onClick={() => navigate(`/sub-category/edit/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' }
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'error.main',
                            bgcolor: '#ffebee',
                            '&:hover': { bgcolor: '#ffcdd2', borderColor: 'error.main' }
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            )
        },
    ];
    
    const [dateRange, setDateRange] = React.useState(() => {
        if (storeStartDate && storeEndDate) {
            return [{
                startDate: new Date(storeStartDate),
                endDate: new Date(storeEndDate),
                key: 'selection'
            }];
        }
        return getLastNDaysRangeForDatePicker(30);
    });
    const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);

    type AdvancedFiltersState = {
        categoryIds: number[];
        subCategoryName: string;
        status: string;
    };
    const emptyAdvancedFilters: AdvancedFiltersState = {
        categoryIds: [],
        subCategoryName: '',
        status: '',
    };

    const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);
    const [appliedAdvancedFilters, setAppliedAdvancedFilters] = React.useState<AdvancedFiltersState>(emptyAdvancedFilters);

    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = React.useState(false);
    const filterOptionsLoadedRef = React.useRef(false);

    React.useEffect(() => {
        if (!filterAnchorEl || filterOptionsLoadedRef.current) return;
        let cancelled = false;
        const loadOptions = async () => {
            setLoadingCategories(true);
            try {
                const res = await fetchCategories({
                    page: 0,
                    pageSize: 500,
                    filters: mergeWithDefaultFilters([], vendorId, selectedBranchId),
                });
                if (!cancelled) {
                    setCategories(res.list || []);
                    filterOptionsLoadedRef.current = true;
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Error loading categories:', err);
                    filterOptionsLoadedRef.current = false;
                }
            } finally {
                if (!cancelled) setLoadingCategories(false);
            }
        };
        loadOptions();
        return () => { cancelled = true; };
    }, [filterAnchorEl, vendorId, selectedBranchId]);

    const buildFilters = React.useCallback((): ServerFilter[] => {
        const applied = appliedAdvancedFilters;
        const advancedFiltersForBuild: Record<string, string | number[] | undefined> = {
            subCategoryName: applied.subCategoryName || undefined,
            status: applied.status || undefined,
            categoryIds: applied.categoryIds?.length ? applied.categoryIds : undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: advancedFiltersForBuild,
            filterMappings: {
                categoryIds: { field: 'categoryId', operator: 'in' },
                subCategoryName: { field: 'title', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
            },
        });
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
    } = useServerPagination<SubCategory>({
        fetchFunction: fetchSubCategories,
        initialPageSize: 20,
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

    // Update filters when applied filters or date range change (Apply updates applied; don't refetch on every form change)
    React.useEffect(() => {
        setFilters(buildFilters());
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [appliedAdvancedFilters, dateRange, setFilters, buildFilters, setPaginationModel]);

    React.useEffect(() => {
        if (filterAnchorEl) {
            setAdvancedFilters(appliedAdvancedFilters);
        }
    }, [filterAnchorEl]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplyFilters = () => {
        const pending = advancedFilters;
        setAppliedAdvancedFilters(pending);
        const advancedFiltersForBuild: Record<string, string | number[] | undefined> = {
            subCategoryName: pending.subCategoryName || undefined,
            status: pending.status || undefined,
            categoryIds: pending.categoryIds?.length ? pending.categoryIds : undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: advancedFiltersForBuild,
            filterMappings: {
                categoryIds: { field: 'categoryId', operator: 'in' },
                subCategoryName: { field: 'title', operator: 'iLike' },
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
        const emptyForBuild: Record<string, string | number[] | undefined> = {
            subCategoryName: undefined,
            status: undefined,
            categoryIds: undefined,
        };
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters: emptyForBuild,
            filterMappings: {
                categoryIds: { field: 'categoryId', operator: 'in' },
                subCategoryName: { field: 'title', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
            },
        });
        const filtersToApply = mergeWithDefaultFilters(additionalFilters, vendorId, selectedBranchId);
        setFilters(filtersToApply);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilterAnchorEl(null);
        fetchData({ force: true, initialFetch: true, filters: filtersToApply });
    };

    const handleDateSelect = (ranges: RangeKeyDict) => {
        if (ranges.selection && ranges.selection.startDate && ranges.selection.endDate) {
            const newDateRange = [{
                startDate: ranges.selection.startDate,
                endDate: ranges.selection.endDate,
                key: ranges.selection.key || 'selection'
            }];
            setDateRange(newDateRange);
            
            // Save to store
            dispatch(setDateRangeAction({
                startDate: ranges.selection.startDate,
                endDate: ranges.selection.endDate,
            }));
        }
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Sub Categories
                </Typography>
                <Link to="/sub-category/new" style={{ textDecoration: 'none' }}>
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
                        Add SubCategory
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
                        id="subcategory-search"
                        placeholder="Search sub categories..."
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
                        <Button
                            variant="outlined"
                            startIcon={<CalendarTodayIcon />}
                            onClick={(e) => setDateAnchorEl(e.currentTarget)}
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
                            {format(dateRange[0].startDate || new Date(), 'MMM dd')} - {format(dateRange[0].endDate || new Date(), 'MMM dd')}
                        </Button>
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
                open={Boolean(dateAnchorEl)}
                anchorEl={dateAnchorEl}
                onClose={() => setDateAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Box sx={{ p: 1 }}>
                    <DateRangePicker
                        ranges={dateRange}
                        onChange={handleDateSelect}
                        moveRangeOnFirstSelection={false}
                    />
                </Box>
            </Popover>

            <Popover
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ p: 3, width: 340 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Sub Categories</Typography>
                    <Autocomplete
                        multiple
                        size="small"
                        options={categories}
                        getOptionLabel={(option) => (typeof option === 'object' && option?.title) ? option.title : ''}
                        value={categories.filter((c) => advancedFilters.categoryIds.includes(c.id))}
                        onChange={(_, newValue) => setAdvancedFilters({ ...advancedFilters, categoryIds: newValue.map((c) => c.id) })}
                        loading={loadingCategories}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Categories"
                                placeholder={advancedFilters.categoryIds.length ? '' : 'Select categories'}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingCategories ? <CircularProgress size={20} color="inherit" /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Sub Category Name"
                        value={advancedFilters.subCategoryName}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, subCategoryName: e.target.value })}
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
                            {SUBCATEGORY_STATUS_OPTIONS.map((option) => (
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
                        key={`subcategory-table-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns} 
                        state={tableState} 
                        handlers={tableHandlers} 
                    />
                </Box>
            </Box>
        </Paper>
    );
}
