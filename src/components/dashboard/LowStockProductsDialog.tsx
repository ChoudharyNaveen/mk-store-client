import React from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import DataTable from '../DataTable';
import type { Column } from '../../types/table';
import type { TableState } from '../../types/table';
import type { LowStockProduct } from '../../types/dashboard';

export interface LowStockProductsDialogProps {
    open: boolean;
    onClose: () => void;
    products: LowStockProduct[];
    loading: boolean;
    columns: Column<LowStockProduct>[];
    onRowClick: (row: LowStockProduct) => void;
}

export default function LowStockProductsDialog({
    open,
    onClose,
    products,
    loading,
    columns,
    onRowClick,
}: LowStockProductsDialogProps) {
    const tableState: TableState<LowStockProduct> = React.useMemo(
        () => ({
            data: products,
            total: products.length,
            page: 1,
            rowsPerPage: 10,
            order: 'asc',
            orderBy: 'stock',
            loading,
            search: '',
        }),
        [products, loading],
    );

    const noopHandlers = React.useMemo(
        () => ({
            handleRequestSort: () => {},
            handleChangePage: () => {},
            handleChangeRowsPerPage: () => {},
        }),
        [],
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon sx={{ color: 'error.main', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        All Low Stock Products
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }} aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3, pt: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                        <Typography color="text.secondary">Loading low stock products...</Typography>
                    </Box>
                ) : products.length > 0 ? (
                    <DataTable
                        columns={columns}
                        state={tableState}
                        handlers={noopHandlers}
                        hidePagination={products.length <= 10}
                        onRowClick={onRowClick}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                        <Typography color="text.secondary">No low stock products found</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
