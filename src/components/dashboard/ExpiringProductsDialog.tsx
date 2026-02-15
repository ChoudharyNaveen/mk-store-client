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
import WarningIcon from '@mui/icons-material/Warning';
import DataTable from '../DataTable';
import type { Column } from '../../types/table';
import type { TableState } from '../../types/table';
import type { ExpiringProductVariant } from '../../types/dashboard';

export interface ExpiringProductsDialogProps {
    open: boolean;
    onClose: () => void;
    tableState: TableState<ExpiringProductVariant>;
    columns: Column<ExpiringProductVariant>[];
    paginationModel: { page: number; pageSize: number };
    onPaginationModelChange: (model: { page: number; pageSize: number }) => void;
    onRowClick: (row: ExpiringProductVariant) => void;
}

export default function ExpiringProductsDialog({
    open,
    onClose,
    tableState,
    columns,
    paginationModel,
    onPaginationModelChange,
    onRowClick,
}: ExpiringProductsDialogProps) {
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
                    <WarningIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        All Expiring Products
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }} aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3, pt: 3 }}>
                <DataTable
                    key={`expiring-products-table-${paginationModel.page}-${paginationModel.pageSize}`}
                    columns={columns}
                    state={tableState}
                    paginationModel={paginationModel}
                    onPaginationModelChange={onPaginationModelChange}
                    onRowClick={onRowClick}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
