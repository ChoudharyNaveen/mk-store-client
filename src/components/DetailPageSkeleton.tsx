import React from 'react';
import { Box, Paper, Skeleton } from '@mui/material';

/**
 * Skeleton loader for detail pages (Product, Order, User, etc.)
 * Mimics the typical layout: header + content area
 */
export default function DetailPageSkeleton() {
    return (
        <Box>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Skeleton variant="rounded" width={80} height={36} />
                        <Skeleton variant="text" width={200} height={40} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Skeleton variant="rounded" width={80} height={36} />
                        <Skeleton variant="rounded" width={80} height={36} />
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rounded" width={140} height={80} sx={{ flex: '1 1 120px' }} />
                    ))}
                </Box>
                <Box sx={{ pt: 2 }}>
                    <Skeleton variant="rectangular" height={48} sx={{ mb: 2, borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                </Box>
            </Paper>
        </Box>
    );
}
