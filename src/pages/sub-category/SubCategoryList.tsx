

import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton, Avatar } from '@mui/material';
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
import { DataFetchParams } from '../../types/table';

interface SubCategory {
    id: number;
    image: string;
    category: string;
    subCategory: string;
    createdDate: string;
}

const mockSubCategories: SubCategory[] = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    image: '/static/images/category/vegetables.jpg',
    category: i % 2 === 0 ? 'Vegetables' : 'Fruits',
    subCategory: i % 2 === 0 ? 'Leafy Vegetables' : 'Melons',
    createdDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}));

const columns = [
    {
        id: 'image' as keyof SubCategory,
        label: 'Image',
        minWidth: 80,
        render: (row: SubCategory) => (
            <Avatar
                src={row.image}
                alt={row.subCategory}
                variant="rounded"
                sx={{ width: 50, height: 50 }}
            />
        )
    },
    { id: 'category' as keyof SubCategory, label: 'Category', minWidth: 150 },
    { id: 'subCategory' as keyof SubCategory, label: 'Sub Category', minWidth: 150 },
    {
        id: 'createdDate' as keyof SubCategory,
        label: 'Created Date',
        minWidth: 150,
        render: (row: SubCategory) => format(new Date(row.createdDate), 'MMM dd, yyyy')
    },
    {
        id: 'action' as keyof SubCategory,
        label: 'Action',
        minWidth: 100,
        align: 'center' as const,
        render: () => (
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

export default function SubCategoryList() {
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
        category: '',
        subCategory: ''
    });

    const fetchData = React.useCallback(async (params: DataFetchParams) => {
        return new Promise<{ data: SubCategory[]; total: number }>((resolve) => {
            setTimeout(() => {
                let filtered = [...mockSubCategories];

                // Global Search
                if (params.search) {
                    filtered = filtered.filter(item =>
                        item.subCategory.toLowerCase().includes(params.search.toLowerCase()) ||
                        item.category.toLowerCase().includes(params.search.toLowerCase())
                    );
                }

                // Advanced Filters
                if (advancedFilters.category) {
                    filtered = filtered.filter(item =>
                        item.category.toLowerCase().includes(advancedFilters.category.toLowerCase())
                    );
                }
                if (advancedFilters.subCategory) {
                    filtered = filtered.filter(item =>
                        item.subCategory.toLowerCase().includes(advancedFilters.subCategory.toLowerCase())
                    );
                }

                // Date Range Filter
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
                    filtered.sort((a: SubCategory, b: SubCategory) => {
                        const aValue = a[params.orderBy as keyof SubCategory];
                        const bValue = b[params.orderBy as keyof SubCategory];
                        if (aValue < bValue) return params.order === 'asc' ? -1 : 1;
                        if (aValue > bValue) return params.order === 'asc' ? 1 : -1;
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

    const { state, handlers } = useTable<SubCategory>({
        fetchData,
        initialRowsPerPage: 10,
    });

    const handleApplyFilters = () => {
        setFilterAnchorEl(null);
        handlers.refresh();
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ category: '', subCategory: '' });
        handlers.refresh();
    };

    const handleDateSelect = (ranges: RangeKeyDict) => {
        if (ranges.selection && ranges.selection.startDate && ranges.selection.endDate) {
            setDateRange([{
                startDate: ranges.selection.startDate,
                endDate: ranges.selection.endDate,
                key: ranges.selection.key || 'selection'
            }]);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 2 }}>
                <TextField
                    id="subcategory-search"
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

                <Link to="/sub-category/new" style={{ textDecoration: 'none' }}>
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
                        Add SubCategory
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
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter SubCategories</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Category"
                        value={advancedFilters.category}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, category: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Sub Category"
                        value={advancedFilters.subCategory}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, subCategory: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleClearFilters} size="small" sx={{ color: 'text.secondary' }}>Clear</Button>
                        <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
                    </Box>
                </Box>
            </Popover>

            <DataTable columns={columns} state={state} handlers={handlers} />
        </Box>
    );
}
