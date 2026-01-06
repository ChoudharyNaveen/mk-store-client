
import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Avatar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchBrands } from '../../services/brand.service';
import type { Brand } from '../../types/brand';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced, mergeWithDefaultFilters } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';

export default function BrandList() {
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
            id: 'logo' as keyof Brand,
            label: 'Logo',
            minWidth: 80,
            render: (row: Brand) => {
                const logoUrl = row.logo || row.image;
                return logoUrl ? (
                    <Avatar
                        src={logoUrl}
                        alt={row.name}
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                    />
                ) : (
                    <Avatar
                        variant="rounded"
                        sx={{ 
                            width: 50, 
                            height: 50,
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontSize: '1.25rem',
                            fontWeight: 600
                        }}
                    >
                        {row.name?.charAt(0)?.toUpperCase() || 'B'}
                    </Avatar>
                );
            }
        },
        { id: 'name' as keyof Brand, label: 'Brand Name', minWidth: 150 },
        { id: 'description' as keyof Brand, label: 'Description', minWidth: 200 },
        { id: 'status' as keyof Brand, label: 'Status', minWidth: 100 },
        {
            id: 'createdAt' as keyof Brand,
            label: 'Created Date',
            minWidth: 120,
            render: (row: Brand) => row.createdAt ? format(new Date(row.createdAt), 'MMM dd, yyyy') : 'N/A'
        },
        {
            id: 'action' as keyof Brand,
            label: 'Action',
            minWidth: 100,
            align: 'center' as const,
            render: (row: Brand) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/brands/edit/${row.id}`)}
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
    const [advancedFilters, setAdvancedFilters] = React.useState({
        brandName: '',
    });

    // Helper function to build filters array with date range and default filters
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters,
            filterMappings: {
                brandName: { field: 'name', operator: 'iLike' },
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
    } = useServerPagination<Brand>({
        fetchFunction: fetchBrands,
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
        setAdvancedFilters({ brandName: '' });
        tableHandlers.refresh();
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
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Brands
                </Typography>
                <Link to="/brands/new" style={{ textDecoration: 'none' }}>
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
                        Add Brand
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
                        id="brands-search"
                        placeholder="Search brands..."
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
                <Box sx={{ p: 3, width: 300 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Brands</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Brand Name"
                        value={advancedFilters.brandName}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, brandName: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </Box>
            </Popover>

                {/* Data Table Section */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <DataTable 
                        key={`brand-table-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns} 
                        state={tableState} 
                        handlers={tableHandlers} 
                    />
                </Box>
            </Box>
        </Box>
    );
}

