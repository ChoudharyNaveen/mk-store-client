import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import type { Column, TableState } from '../../types/table';
import type { Product, ProductVariant } from '../../types/product';

function formatVariantItemDetails(variant: ProductVariant): string {
    const parts: string[] = [];
    if (variant.quantity !== undefined && variant.quantity !== null) {
        parts.push(`${variant.quantity} unit${variant.quantity !== 1 ? 's' : ''}`);
    }
    if (variant.item_quantity !== undefined && variant.item_quantity !== null && variant.item_unit) {
        parts.push(`${variant.item_quantity} ${variant.item_unit}`);
    } else if (variant.item_quantity !== undefined && variant.item_quantity !== null) {
        parts.push(`${variant.item_quantity}`);
    } else if (variant.item_unit) {
        parts.push(variant.item_unit);
    }
    return parts.length > 0 ? parts.join(' × ') : 'N/A';
}

function formatExpiryDate(expiryDate: string | Date | undefined | null): { text: string; color: string } {
    if (!expiryDate) {
        return { text: 'N/A', color: '#666' };
    }
    try {
        const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(date);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const formattedDate = format(date, 'MMM dd, yyyy');
        if (diffDays < 0) {
            return { text: formattedDate, color: '#d32f2f' };
        }
        if (diffDays <= 7) {
            return { text: formattedDate, color: '#ed6c02' };
        }
        return { text: formattedDate, color: '#2e7d32' };
    } catch {
        return { text: 'Invalid Date', color: '#666' };
    }
}

const variantColumns: Column<ProductVariant>[] = [
    {
        id: 'variant_name',
        label: 'Variant Name',
        minWidth: 120,
    },
    {
        id: 'price',
        label: 'MRP',
        minWidth: 100,
        align: 'right',
        format: (value: number) => `₹${value}`,
    },
    {
        id: 'selling_price',
        label: 'Selling Price',
        minWidth: 120,
        align: 'right',
        format: (value: number) => `₹${value}`,
    },
    {
        id: 'quantity',
        label: 'Quantity',
        minWidth: 100,
        align: 'right',
    },
    {
        id: 'item_quantity' as keyof ProductVariant,
        label: 'Item Details',
        minWidth: 150,
        render: (row: ProductVariant) => formatVariantItemDetails(row),
    },
    {
        id: 'expiry_date' as keyof ProductVariant,
        label: 'Expiry Date',
        minWidth: 120,
        render: (row: ProductVariant) => {
            const { text: expiryText, color: expiryColor } = formatExpiryDate(row.expiry_date);
            return (
                <Typography variant="body2" sx={{ color: expiryColor, fontWeight: 500 }}>
                    {expiryText}
                </Typography>
            );
        },
    },
    {
        id: 'product_status' as keyof ProductVariant,
        label: 'Status',
        minWidth: 100,
        render: (row: ProductVariant) => (
            <Chip
                label={row.product_status}
                size="small"
                color={row.product_status === 'INSTOCK' ? 'success' : 'error'}
                sx={{ fontWeight: 500 }}
            />
        ),
    },
];

export interface VariantsPopoverProps {
    product: Product;
}

export default function VariantsPopover({ product }: VariantsPopoverProps) {
    if (!product.variants || product.variants.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    No variants available
                </Typography>
            </Box>
        );
    }

    const variantTableState: TableState<ProductVariant> = {
        data: product.variants,
        total: product.variants.length,
        page: 0,
        rowsPerPage: product.variants.length,
        order: 'asc',
        orderBy: 'variant_name',
        loading: false,
        search: '',
    };

    return (
        <Box sx={{ width: 900, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                Variants for {product.title}
            </Typography>
            <DataTable
                columns={variantColumns}
                state={variantTableState}
                hidePagination={true}
                disableContainerMinHeight
            />
        </Box>
    );
}
