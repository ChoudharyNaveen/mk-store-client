'use client';

import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';

const cards = [
    { title: 'Total User', value: '40,689', change: '8.5% Up from yesterday', icon: <PeopleIcon fontSize="large" sx={{ color: '#7e57c2' }} />, color: '#ede7f6', trend: 'up' },
    { title: 'Total Order', value: '10293', change: '1.3% Up from past week', icon: <InventoryIcon fontSize="large" sx={{ color: '#ffca28' }} />, color: '#fff8e1', trend: 'up' },
    { title: 'Order List', value: '₹890', change: '4.3% Down from yesterday', icon: <ShoppingCartIcon fontSize="large" sx={{ color: '#66bb6a' }} />, color: '#e8f5e9', trend: 'down' },
    { title: 'Total Returns', value: '204', change: '1.8% Up from yesterday', icon: <AssignmentReturnIcon fontSize="large" sx={{ color: '#ff7043' }} />, color: '#fbe9e7', trend: 'up' },
];

export default function DashboardPage() {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Dashboard</Typography>

            <Grid container spacing={3}>
                {cards.map((card, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: 'none' }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{card.title}</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>{card.value}</Typography>
                                <Typography variant="caption" sx={{ color: card.trend === 'up' ? 'success.main' : 'error.main', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    {/* Add icons for trend here if needed */}
                                    {card.change}
                                </Typography>
                            </Box>
                            <Box sx={{
                                bgcolor: card.color,
                                borderRadius: 3,
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {card.icon}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Paper sx={{ p: 3, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">Sales Details</Typography>
                        {/* Placeholders for dropdowns */}
                    </Box>
                    <Box sx={{ height: 300, bgcolor: '#f5f7fa', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">Chart Placeholder</Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
