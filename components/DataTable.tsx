'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    Pagination,
    CircularProgress,
    Stack,
    InputAdornment,
    IconButton,
    TableSortLabel
} from '@mui/material';
import { Column, TableState } from '../types/table';

interface DataTableProps<T> {
    columns: Column<T>[];
    state: TableState<T>;
    handlers: {
        handleRequestSort: (property: string) => void;
        handleChangePage: (event: unknown, newPage: number) => void;
        handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    };
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    state,
    handlers,
}: DataTableProps<T>) {
    const { data, total, page, rowsPerPage, order, orderBy, loading } = state;

    const createSortHandler = (property: string) => (event: React.MouseEvent<unknown>) => {
        handlers.handleRequestSort(property);
    };

    return (
        <React.Fragment>

            <Paper sx={{ width: '100%', mb: 2, p: 2, borderRadius: 2, boxShadow: 'none' }}>
                <TableContainer>
                    <Table stickyHeader sx={{ minWidth: 750 }}>
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={String(column.id)}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                        sortDirection={orderBy === column.id ? order : false}
                                        sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}
                                    >
                                        {column.sortable ? (
                                            <TableSortLabel
                                                active={orderBy === column.id}
                                                direction={orderBy === column.id ? order : 'asc'}
                                                onClick={createSortHandler(String(column.id))}
                                            >
                                                {column.label}
                                            </TableSortLabel>
                                        ) : (
                                            column.label
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">No data found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, index) => (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={row.id || index}>
                                        {columns.map((column) => {
                                            const value = row[column.id] as any;
                                            return (
                                                <TableCell key={String(column.id)} align={column.align} sx={{ borderBottom: '1px solid #f5f5f5', py: 2 }}>
                                                    {column.render ? column.render(row) : (column.format && typeof value !== 'undefined' ? column.format(value) : value)}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination and Rows Per Page */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
                        <Select
                            value={rowsPerPage}
                            onChange={handlers.handleChangeRowsPerPage as any}
                            size="small"
                            variant="standard"
                            disableUnderline
                            sx={{
                                '& .MuiSelect-select': {
                                    py: 0.5,
                                    px: 1.5,
                                    pr: '24px !important',
                                    bgcolor: '#f5f7fa',
                                    borderRadius: 2,
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'text.primary'
                                },
                                '& .MuiSvgIcon-root': {
                                    right: 2
                                }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    elevation: 0,
                                    sx: {
                                        mt: 1,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0',
                                        '& .MuiMenuItem-root': {
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            py: 1
                                        }
                                    }
                                }
                            }}
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={100}>100</MenuItem>
                        </Select>
                    </Box>

                    <Pagination
                        count={Math.ceil(total / rowsPerPage)}
                        page={page}
                        onChange={handlers.handleChangePage}
                        shape="rounded"
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            </Paper>
        </React.Fragment>
    );
}
