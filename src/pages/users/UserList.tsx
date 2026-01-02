

import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { useTable } from '../../hooks/useTable';
import { Column } from '../../types/table';
import {
    IconButton,
    Box,
    TextField,
    Button,
    Popover,
    InputAdornment,
    Grid as Grid2,
    Typography,
    Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Mock Data
interface UserData {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    joinedDate: string; // Added date for filtering simulation
}

const mockData: UserData[] = Array.from({ length: 50 }, (_, index) => ({
    id: `user-${index + 1}`,
    name: 'Jhon',
    phone: '+91xxxxxxxxxx',
    email: 'axxxxxxxxxx@gmail.com',
    address: 'H:No 24/207, malkpet, street No 2, Hyderabad, 500034',
    joinedDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
}));

const columns: Column<UserData>[] = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'phone', label: 'Phone No', sortable: false },
    { id: 'email', label: 'Email ID', sortable: true },
    { id: 'address', label: 'Address', sortable: false },
    {
        id: 'joinedDate',
        label: 'Joined Date',
        sortable: true,
        render: (row) => format(new Date(row.joinedDate), 'MMM dd, yyyy')
    },
    {
        id: 'id', // using 'id' as simple filler
        label: 'Action',
        align: 'right',
        render: (row) => (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <IconButton
                    size="small"
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
        ),
    },
];

interface AdvancedFilters {
    name: string;
    email: string;
    phone: string;
}

export default function UserList() {
    // Advanced Filter Popover State
    const [anchorElFilter, setAnchorElFilter] = useState<HTMLButtonElement | null>(null);
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
        name: '',
        email: '',
        phone: ''
    });

    // Date Range Picker State
    const [anchorElDate, setAnchorElDate] = useState<HTMLButtonElement | null>(null);
    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2025-12-31'),
            key: 'selection'
        }
    ]);

    const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElFilter(event.currentTarget);
    };

    const handleFilterClose = () => {
        setAnchorElFilter(null);
    };

    const handleDateClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElDate(event.currentTarget);
    };

    const handleDateClose = () => {
        setAnchorElDate(null);
    };

    const handleDateSelect = (ranges: RangeKeyDict) => {
        setDateRange([ranges.selection as any]);
    };

    const openFilter = Boolean(anchorElFilter);
    const openDate = Boolean(anchorElDate);

    const fetchData = React.useCallback(async (params: any) => {
        // Simulate API call
        return new Promise<{ data: UserData[]; total: number }>((resolve) => {
            setTimeout(() => {
                let filtered = [...mockData];

                // Global Search (from hook)
                if (params.search) {
                    filtered = filtered.filter(u =>
                        u.name.toLowerCase().includes(params.search.toLowerCase()) ||
                        u.email.includes(params.search)
                    );
                }

                // Advanced Filters
                if (advancedFilters.name) {
                    filtered = filtered.filter(u => u.name.toLowerCase().includes(advancedFilters.name.toLowerCase()));
                }
                if (advancedFilters.email) {
                    filtered = filtered.filter(u => u.email.toLowerCase().includes(advancedFilters.email.toLowerCase()));
                }
                if (advancedFilters.phone) {
                    filtered = filtered.filter(u => u.phone.includes(advancedFilters.phone));
                }

                // Date Range Filter
                if (dateRange[0].startDate && dateRange[0].endDate) {
                    filtered = filtered.filter(u => {
                        const date = new Date(u.joinedDate);
                        return isWithinInterval(date, {
                            start: startOfDay(dateRange[0].startDate),
                            end: endOfDay(dateRange[0].endDate)
                        });
                    });
                }

                // Mock Sort (basic)
                if (params.orderBy) {
                    filtered.sort((a: any, b: any) => {
                        if (a[params.orderBy] < b[params.orderBy]) return params.order === 'asc' ? -1 : 1;
                        if (a[params.orderBy] > b[params.orderBy]) return params.order === 'asc' ? 1 : -1;
                        return 0;
                    });
                }

                // Mock Pagination
                const start = (params.page - 1) * params.rowsPerPage;
                const end = start + params.rowsPerPage;
                const data = filtered.slice(start, end);

                resolve({ data, total: filtered.length });
            }, 600);
        });
    }, [advancedFilters, dateRange]);

    const { state, handlers } = useTable<UserData>({
        fetchData,
        defaultOrderBy: 'name',
    });

    const handleApplyFilters = () => {
        handleFilterClose();
        handlers.refresh();
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ name: '', email: '', phone: '' });
        handlers.refresh();
    };

    return (
        <Box>
            {/* Action Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={state.search}
                    onChange={handlers.handleSearch}
                    sx={{
                        width: 300,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 10,
                            bgcolor: 'white',
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

                {/* Date Picker Trigger */}
                <Button
                    variant="outlined"
                    startIcon={<CalendarTodayIcon />}
                    onClick={handleDateClick}
                    sx={{ borderRadius: 8, textTransform: 'none', borderColor: '#e0e0e0', color: 'text.secondary' }}
                >
                    {format(dateRange[0].startDate, 'MMM dd')} - {format(dateRange[0].endDate, 'MMM dd')}
                </Button>
                <Popover
                    open={openDate}
                    anchorEl={anchorElDate}
                    onClose={handleDateClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    <Box sx={{ p: 1 }}>
                        <DateRangePicker
                            ranges={dateRange}
                            onChange={handleDateSelect}
                            moveRangeOnFirstSelection={false}
                        />
                    </Box>
                </Popover>

                {/* Advanced Filter Trigger */}
                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={handleFilterClick}
                    sx={{ borderRadius: 8, textTransform: 'none', borderColor: '#e0e0e0', color: 'text.secondary' }}
                >
                    Advanced Search
                </Button>

                <Link to="/users/new" style={{ textDecoration: 'none' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        Add User
                    </Button>
                </Link>
                <Popover
                    open={openFilter}
                    anchorEl={anchorElFilter}
                    onClose={handleFilterClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right', // Align to right so it doesn't go off screen
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <Box sx={{ p: 3, width: 320 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Users</Typography>
                        <Grid2 container spacing={2}>
                            <Grid2 size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    size="small"
                                    value={advancedFilters.name}
                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    size="small"
                                    value={advancedFilters.email}
                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    size="small"
                                    value={advancedFilters.phone}
                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                                <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                            </Grid2>
                        </Grid2>
                    </Box>
                </Popover>
            </Box>

            <DataTable
                columns={columns}
                state={state}
                handlers={handlers}
            />
        </Box>
    );
}
