

import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Popover, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import DataTable from '../../components/DataTable';
import { useTable } from '../../hooks/useTable';
import { RangeKeyDict } from 'react-date-range';

interface Order {
    id: string;
    customerName: string;
    orderDate: string;
    amount: string;
    status: string;
}

const mockOrders: Order[] = Array.from({ length: 50 }, (_, i) => ({
    id: `ORD${1000 + i}`,
    customerName: 'John Doe',
    orderDate: '28/12/2025',
    amount: '₹1,250',
    status: 'Delivered',
}));

const columns = [
    { id: 'id' as keyof Order, label: 'Order ID', minWidth: 100 },
    { id: 'customerName' as keyof Order, label: 'Customer Name', minWidth: 150 },
    { id: 'orderDate' as keyof Order, label: 'Order Date', minWidth: 120 },
    { id: 'amount' as keyof Order, label: 'Amount', minWidth: 100 },
    { id: 'status' as keyof Order, label: 'Status', minWidth: 100 },
    {
        id: 'action' as keyof Order,
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

export default function OrderList() {
    const [dateRange, setDateRange] = React.useState([{
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    }]);
    const [dateAnchorEl, setDateAnchorEl] = React.useState<null | HTMLElement>(null);
    const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);

    const { state, handlers } = useTable<Order>({
        fetchData: async (params) => {
            const filteredData = params.search
                ? mockOrders.filter(item => item.customerName.toLowerCase().includes(params.search.toLowerCase()) || item.id.toLowerCase().includes(params.search.toLowerCase()))
                : mockOrders;
            const start = (params.page - 1) * params.rowsPerPage;
            const end = start + params.rowsPerPage;
            return { data: filteredData.slice(start, end), total: filteredData.length };
        },
        initialRowsPerPage: 10,
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 2 }}>
                <TextField
                    id="orders-search"
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
                    Date Range
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    sx={{ borderRadius: 8, textTransform: 'none', borderColor: '#e0e0e0', color: 'text.secondary' }}
                >
                    Advanced Filter
                </Button>
            </Box>

            <Popover
                open={Boolean(dateAnchorEl)}
                anchorEl={dateAnchorEl}
                onClose={() => setDateAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <DateRange
                    editableDateInputs={true}
                    onChange={(ranges: RangeKeyDict) => {
                        if (ranges.selection && ranges.selection.startDate && ranges.selection.endDate) {
                            setDateRange([{
                                startDate: ranges.selection.startDate,
                                endDate: ranges.selection.endDate,
                                key: ranges.selection.key || 'selection'
                            }]);
                        }
                    }}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                />
            </Popover>

            <Popover
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Box sx={{ p: 2, minWidth: 250 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Advanced Filters</Typography>
                    <TextField fullWidth size="small" label="Order ID" sx={{ mb: 2 }} />
                    <TextField fullWidth size="small" label="Customer Name" sx={{ mb: 2 }} />
                    <TextField fullWidth size="small" label="Status" sx={{ mb: 2 }} />
                    <Button variant="contained" fullWidth>Apply Filters</Button>
                </Box>
            </Popover>

            <DataTable columns={columns} state={state} handlers={handlers} />
        </Box>
    );
}
