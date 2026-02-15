import React from 'react';
import { Box, Typography } from '@mui/material';

export interface TabOption<T = string> {
    value: T;
    label: string;
}

interface CustomTabsProps<T = string> {
    tabs: TabOption<T>[];
    value: T;
    onChange: (value: T) => void;
}

export default function CustomTabs<T = string>({
    tabs,
    value,
    onChange,
}: CustomTabsProps<T>) {
    return (
        <Box
            sx={{
                display: 'flex',
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                p: 0.5,
                gap: 0,
                width: '100%',
                minWidth: 320,
                maxWidth: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}
        >
            {tabs.map((tab, index) => {
                const isActive = value === tab.value;
                return (
                    <Box
                        key={index}
                        onClick={() => onChange(tab.value)}
                        sx={{
                            px: { xs: 1.5, sm: 2, md: 3 },
                            py: 1.2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            borderRadius: 1.5,
                            bgcolor: isActive ? 'white' : 'transparent',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? '#000000' : '#666666',
                            transition: 'all 0.2s ease-in-out',
                            flex: '1 1 0',
                            minWidth: 140,
                            maxWidth: '100%',
                            boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                            '&:hover': {
                                bgcolor: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            },
                        }}
                    >
                        <Typography
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.875rem',
                                lineHeight: 1.5,
                                userSelect: 'none',
                                width: '100%',
                            }}
                        >
                            {tab.label}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}
