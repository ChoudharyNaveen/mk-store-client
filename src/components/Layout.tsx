import React from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function Layout({ isSidebarOpen, onToggleSidebar }: LayoutProps) {
    return (
        <Box sx={{ display: 'flex' }}>
            <Header open={isSidebarOpen} />
            <Sidebar open={isSidebarOpen} onToggle={onToggleSidebar} />
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: '#f5f7fa', minHeight: '100vh', p: 3 }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}

