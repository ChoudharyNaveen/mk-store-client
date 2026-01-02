

import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useTable } from '../../hooks/useTable';

const mockPromocodes = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    type: i % 2 === 0 ? 'Percentage' : 'Flat',
    code: `PROMO${i + 1}`,
    percentage: 10 + (i % 5),
    startDate: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
    endDate: new Date(Date.now() + Math.floor(Math.random() * 5000000000)).toISOString(),
    noOfUsed: Math.floor(Math.random() * 100),
    createdDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

const columns = [
    { id: 'type', label: 'Type', minWidth: 100 },
    { id: 'code', label: 'Code', minWidth: 120 },
    { id: 'percentage', label: 'Percentage', minWidth: 100 },
    {
        id: 'startDate',
        label: 'Start Date',
        minWidth: 120,
        render: (row: any) => format(new Date(row.startDate), 'MMM dd, yyyy')
    },
    {
        id: 'endDate',
        label: 'End Date',
        minWidth: 120,
        render: (row: any) => format(new Date(row.endDate), 'MMM dd, yyyy')
    },
    { id: 'noOfUsed', label: 'No of Used', minWidth: 100 },
    {
        id: 'action',
        label: 'Action',
        minWidth: 100,
        align: 'center' as const,
        render: (row: any) => (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
        )
    },
];

export default function PromocodeList() {
    const [dateRange, setDateRange] = React.useState([
        {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2025-12-31'),
            key: 'selection'
        }
    ]);
    const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const [advancedFilters, setAdvancedFilters] = React.useState({
        code: '',
        type: '',
    });

    const fetchData = React.useCallback(async (params: any) => {
        return new Promise<{ data: any[]; total: number }>((resolve) => {
            setTimeout(() => {
                let filtered = [...mockPromocodes];

                // Global Search
                if (params.search) {
                    filtered = filtered.filter(item =>
                        item.code.toLowerCase().includes(params.search.toLowerCase()) ||
                        item.type.toLowerCase().includes(params.search.toLowerCase())
                    );
                }

                // Advanced Filters
                if (advancedFilters.code) {
                    filtered = filtered.filter(item =>
                        item.code.toLowerCase().includes(advancedFilters.code.toLowerCase())
                    );
                }
                if (advancedFilters.type) {
                    filtered = filtered.filter(item =>
                        item.type.toLowerCase().includes(advancedFilters.type.toLowerCase())
                    );
                }

                // Date Range Filter (Filtered by createdDate for consistency across pages)
                if (dateRange[0].startDate && dateRange[0].endDate) {
                    filtered = filtered.filter(item => {
                        const date = new Date(item.createdDate);
                        return isWithinInterval(date, {
                            start: startOfDay(dateRange[0].startDate),
                            end: endOfDay(dateRange[0].endDate)
                        });
                    });
                }

                // Sort
                if (params.orderBy) {
                    filtered.sort((a: any, b: any) => {
                        const valA = a[params.orderBy];
                        const valB = b[params.orderBy];
                        if (valA < valB) return params.order === 'asc' ? -1 : 1;
                        if (valA > valB) return params.order === 'asc' ? 1 : -1;
                        return 0;
                    });
                }

                const start = (params.page - 1) * params.rowsPerPage;
                const end = start + params.rowsPerPage;
                resolve({
                    data: filtered.slice(start, end),
                    total: filtered.length,
                });
            }, 500);
        });
    }, [dateRange, advancedFilters]);

    const { state, handlers } = useTable({
        fetchData,
        initialRowsPerPage: 10,
    });

    const handleApplyFilters = () => {
        setFilterAnchorEl(null);
        handlers.refresh();
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ code: '', type: '' });
        handlers.refresh();
    };

    const handleDateSelect = (ranges: RangeKeyDict) => {
        setDateRange([ranges.selection as any]);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 2 }}>
                <TextField
                    id="promocode-search"
                    placeholder="Search"
                    variant="outlined"
                    size="small"
                    value={state.search}
                    onChange={handlers.handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: 300,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 10,
                            bgcolor: 'white',
                        }
                    }}
                />
                <Button
                    variant="outlined"
                    startIcon={<CalendarTodayIcon />}
                    onClick={(e) => setDateAnchorEl(e.currentTarget)}
                    sx={{ borderRadius: 8, textTransform: 'none', borderColor: '#e0e0e0', color: 'text.secondary' }}
                >
                    {format(dateRange[0].startDate || new Date(), 'MMM dd')} - {format(dateRange[0].endDate || new Date(), 'MMM dd')}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    sx={{ borderRadius: 8, textTransform: 'none', borderColor: '#e0e0e0', color: 'text.secondary' }}
                >
                    Advanced Search
                </Button>

                <Link to="/promo-code/new" style={{ textDecoration: 'none' }}>
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
                        Add Promocode
                    </Button>
                </Link>
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </Box>
            </Popover>

            {/* @ts-expect-error - action column id may not be part of the data type but is valid for rendering */}
            <DataTable columns={columns} state={state} handlers={handlers} />
        </Box>
    );
}
