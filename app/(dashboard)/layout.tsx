'use client';

import React from 'react';
import Box from '@mui/material/Box';

import Toolbar from '@mui/material/Toolbar';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Header open={isSidebarOpen} />
            <Sidebar open={isSidebarOpen} onToggle={toggleSidebar} />
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: '#f5f7fa', minHeight: '100vh', p: 3 }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
