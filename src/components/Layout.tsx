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
        <Box 
            sx={{ 
                display: 'flex',
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}
        >
            <Header open={isSidebarOpen} />
            <Sidebar open={isSidebarOpen} onToggle={onToggleSidebar} />
            <Box
                component="main"
                sx={{ 
                    flexGrow: 1,
                    bgcolor: '#f5f7fa',
                    height: '100vh',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1
                }}
            >
                <Toolbar />
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}

