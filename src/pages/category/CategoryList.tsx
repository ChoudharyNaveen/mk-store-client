
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
import { fetchCategories } from '../../services/category.service';
import type { Category } from '../../types/category';
import type { ServerFilter } from '../../types/filter';
import { getLastNDaysRangeForDatePicker } from '../../utils/date';
import { buildFiltersFromDateRangeAndAdvanced } from '../../utils/filterBuilder';

export default function CategoryPage() {
    const navigate = useNavigate();
    
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
        { id: 'title' as keyof Category, label: 'Category', minWidth: 150 },
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
    
    const [dateRange, setDateRange] = React.useState(getLastNDaysRangeForDatePicker(30));
    const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const [advancedFilters, setAdvancedFilters] = React.useState({
        categoryName: ''
    });

    // Helper function to build filters array with date range
    const buildFilters = React.useCallback((): ServerFilter[] => {
        return buildFiltersFromDateRangeAndAdvanced({
            dateRange,
            dateField: 'createdAt',
            advancedFilters,
            filterMappings: {
                categoryName: { field: 'title', operator: 'iLike' },
            },
        });
    }, [dateRange, advancedFilters]);

    // Use server pagination hook
    const {
        rows,
        totalCount,
        loading,
        paginationModel,
        setPaginationModel,
        searchKeyword,
        setSearchKeyword,
        setFilters,
        refresh,
    } = useServerPagination<Category>({
        fetchFunction: fetchCategories,
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

    // Update filters when advanced filters or date range changes
    React.useEffect(() => {
        setFilters(buildFilters());
    }, [advancedFilters, dateRange, setFilters, buildFilters]);

    // Adapt useServerPagination data to DataTable format
    const state = {
        data: rows,
        total: totalCount,
        page: paginationModel.page + 1, // Convert 0-based to 1-based
        rowsPerPage: paginationModel.pageSize,
        order: 'asc' as const,
        orderBy: '',
        loading,
        search: searchKeyword,
    };

    const handlers = {
        handleRequestSort: () => {
            // Sorting can be handled via filters if API supports it
        },
        handleChangePage: (_event: unknown, newPage: number) => {
            setPaginationModel((prev) => ({ ...prev, page: newPage - 1 })); // Convert 1-based to 0-based
        },
        handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const newPageSize = parseInt(event.target.value, 10);
            setPaginationModel((prev) => ({ ...prev, pageSize: newPageSize, page: 0 }));
        },
        handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => {
            setSearchKeyword(event.target.value);
        },
        refresh,
    };

    const handleApplyFilters = () => {
        setFilterAnchorEl(null);
        refresh();
    };

    const handleClearFilters = () => {
        setAdvancedFilters({ categoryName: '' });
        refresh();
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
                    id="category-search"
                    placeholder="Search"
                    variant="outlined"
                    size="small"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
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
                                <SearchIcon />
                            </InputAdornment>
                        ),
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
                <Link to="/category/new" style={{ textDecoration: 'none' }}>
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
                        Add Category
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
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Filter Categories</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Category Name"
                        value={advancedFilters.categoryName}
                        onChange={(e) => setAdvancedFilters({ categoryName: e.target.value })}
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

