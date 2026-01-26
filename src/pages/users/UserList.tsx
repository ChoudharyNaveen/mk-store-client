
import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Tooltip, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import CustomTabs from '../../components/CustomTabs';
import { useServerPagination } from '../../hooks/useServerPagination';
import { fetchUsers, convertUserToRider, updateUserStatus, type FetchParams } from '../../services/user.service';
import type { User, UserRole } from '../../types/user';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced } from '../../utils/filterBuilder';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDateRange as setDateRangeAction } from '../../store/dateRangeSlice';
import { Column } from '../../types/table';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { USER_STATUS_OPTIONS, PROFILE_STATUS_OPTIONS } from '../../constants/statusOptions';


interface AdvancedFilters {
    name: string;
    email: string;
    phone: string;
    status: string;
    profileStatus: string;
}

export default function UserList() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.auth.user);
    
    // Tab State
    const [activeTab, setActiveTab] = React.useState<UserRole>('USER');
    
    // Get date range from store, or use default
    const storeStartDate = useAppSelector((state) => state.dateRange.startDate);
    const storeEndDate = useAppSelector((state) => state.dateRange.endDate);
    
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
    const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFilters>({
        name: '',
        email: '',
        phone: '',
        status: '',
        profileStatus: ''
    });

    const handleTabChange = (newValue: UserRole) => {
        setActiveTab(newValue);
    };

    // Create a wrapper function that includes the activeTab
    const fetchUsersWithTab = React.useCallback(
        (params: FetchParams) => {
            return fetchUsers({
                ...params,
                tab: activeTab,
            });
        },
        [activeTab]
    );

    // Helper function to build filters array with date range and default filters
    const buildFilters = React.useCallback((): ServerFilter[] => {
        const additionalFilters = buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'created_at',
            advancedFilters: advancedFilters as unknown as Record<string, string | number | boolean | null | undefined>,
            filterMappings: {
                name: { field: 'name', operator: 'iLike' },
                email: { field: 'email', operator: 'iLike' },
                phone: { field: 'phone', operator: 'iLike' },
                status: { field: 'status', operator: 'eq' },
                profileStatus: { field: 'profileStatus', operator: 'eq' },
            },
        });
        
        // Return filters without default vendorId and branchId
        return additionalFilters;
    }, [dateRange, advancedFilters]);

    // Use server pagination hook - now includes tableState and tableHandlers
    const {
        paginationModel,
        setPaginationModel,
        setFilters,
        tableState,
        tableHandlers,
    } = useServerPagination<User>({
        fetchFunction: fetchUsersWithTab,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: buildFilters(),
        initialSorting: [
            {
                key: 'created_at',
                direction: 'DESC',
            },
        ],
        searchDebounceMs: 500,
    });

    // Refresh data when tab changes - need to rebuild filters and reset pagination
    React.useEffect(() => {
        // Reset pagination and clear last fetched ref to force a new fetch
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilters(buildFilters());
        // The fetchUsersWithTab callback will have the new tab value
        // Force a refresh to ensure we fetch with the new tab
        tableHandlers.refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

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
        const newFilters = buildFilters();
        setFilters(newFilters);
        // Reset to first page when filters change
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [advancedFilters, dateRange]);

    const handleApplyFilters = () => {
        setFilterAnchorEl(null);
        // Filters will be updated via the useEffect that watches advancedFilters
        // No need to manually refresh, the effect will handle it
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ name: '', email: '', phone: '', status: '', profileStatus: '' });
        // Filters will be updated via the useEffect that watches advancedFilters
        // No need to manually refresh, the effect will handle it
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

    const handleConvertToRider = async (userId: string | number) => {
        try {
            await convertUserToRider(userId);
            showSuccessToast('User converted to rider successfully!');
            // Refresh the table to reflect the changes
            tableHandlers.refresh();
        } catch {
            showErrorToast('Failed to convert user to rider. Please try again.');
        }
    };

    const handleToggleStatus = async (user: User) => {
        if (!currentUser?.id) {
            showErrorToast('Unable to identify current user. Please try again.');
            return;
        }
        
        const currentStatus = user.status || 'INACTIVE';
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const action = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
        
        try {
            await updateUserStatus(user.id, newStatus, currentUser.id, user.concurrencyStamp);
            showSuccessToast(`User ${action}d successfully!`);
            // Refresh the table to reflect the changes
            tableHandlers.refresh();
        } catch {
            showErrorToast(`Failed to ${action} user. Please try again.`);
        }
    };

    const columns: Column<User>[] = [
        {
            id: 'name' as keyof User,
            label: 'Name',
            sortable: true,
            render: (row: User) => (
                <Typography
                    sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontWeight: 500,
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                    onClick={() => navigate(`/users/detail/${row.id}`)}
                >
                    {row.name || ''}
                </Typography>
            ),
        },
        {
            id: 'mobileNumber' as keyof User,
            label: 'Phone No',
            sortable: false,
            render: (row: User) => (
                <Typography
                    sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontWeight: 500,
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                    onClick={() => navigate(`/users/detail/${row.id}`)}
                >
                    {row.mobileNumber || row.phone || 'N/A'}
                </Typography>
            ),
        },
        { id: 'email' as keyof User, label: 'Email ID', sortable: true },
        { id: 'status' as keyof User, label: 'Status', sortable: true, minWidth: 100 },
        { id: 'profileStatus' as keyof User, label: 'Profile Status', sortable: true, minWidth: 120 },
        {
            id: 'createdAt' as keyof User,
        label: 'Joined Date',
        sortable: true,
            render: (row: User) => {
                if (!row.createdAt) return 'N/A';
                const date = new Date(row.createdAt);
                return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM dd, yyyy');
            }
        },
        {
            id: 'action' as keyof User,
        label: 'Action',
            minWidth: 120,
            align: 'right' as const,
            render: (row: User) => {
                const isActive = row.status === 'ACTIVE';
                return (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {activeTab === 'USER' && (
                            <Tooltip title="Convert User to Rider" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => handleConvertToRider(row.id)}
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        color: 'text.secondary',
                                        '&:hover': { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' }
                                    }}
                                >
                                    <SwapHorizIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={isActive ? 'Deactivate User' : 'Activate User'} arrow>
                            <IconButton
                                size="small"
                                onClick={() => handleToggleStatus(row)}
                                sx={{
                                    border: `1px solid ${isActive ? '#c8e6c9' : '#ffcdd2'}`,
                                    borderRadius: 2,
                                    color: isActive ? 'error.main' : 'success.main',
                                    bgcolor: isActive ? '#ffebee' : '#e8f5e9',
                                    '&:hover': { 
                                        bgcolor: isActive ? '#ffcdd2' : '#c8e6c9', 
                                        borderColor: isActive ? '#ffcdd2' : '#c8e6c9' 
                                    }
                                }}
                            >
                                {isActive ? (
                                   <BlockIcon fontSize="small" />
                                ) : (
                                    <CheckCircleIcon fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
    },
];

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 1 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Users
                </Typography>
                <Link to="/users/new" style={{ textDecoration: 'none' }}>
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
                        Add User
                    </Button>
                </Link>
            </Box>

            {/* Unified Container for Tabs, Search, Filters and Table */}
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
                {/* Tabs Section */}
                <Box sx={{ 
                    p: 2.5, 
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}>
                    <CustomTabs<UserRole>
                        tabs={[
                            { value: 'USER', label: 'User' },
                            { value: 'RIDER', label: 'Rider' },
                        ]}
                        value={activeTab}
                        onChange={handleTabChange}
                    />
                </Box>

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
                        id="user-search"
                        placeholder="Search users..."
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
                        <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Users</Typography>
                                <TextField
                                    fullWidth
                        size="small"
                                    label="Name"
                                    value={advancedFilters.name}
                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, name: e.target.value }))}
                        sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                        size="small"
                                    label="Email"
                                    value={advancedFilters.email}
                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, email: e.target.value }))}
                        sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                        size="small"
                                    label="Phone"
                                    value={advancedFilters.phone}
                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, phone: e.target.value }))}
                        sx={{ mb: 2 }}
                                />
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={advancedFilters.status}
                                        label="Status"
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        {USER_STATUS_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                    <InputLabel>Profile Status</InputLabel>
                                    <Select
                                        value={advancedFilters.profileStatus}
                                        label="Profile Status"
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, profileStatus: e.target.value }))}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        {PROFILE_STATUS_OPTIONS.map((option) => (
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
                        key={`user-table-${activeTab}-${paginationModel.page}-${paginationModel.pageSize}`}
                        columns={columns}
                        state={tableState}
                        handlers={tableHandlers}
                    />
                </Box>
            </Box>
        </Paper>
    );
}
