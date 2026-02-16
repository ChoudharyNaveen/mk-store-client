import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

export interface KPICardProps {
    /** Label text displayed above the value */
    label: string;
    /** Main value to display */
    value: string | number;
    /** Optional icon component (e.g., <ShoppingCartIcon />) */
    icon?: React.ReactNode;
    /** Background color for the icon avatar (e.g., 'primary.main', '#1976d2') */
    iconBgColor?: string;
    /** Light background color for the card (e.g., '#e3f2fd', '#f1f8e9') */
    bgColor?: string;
    /** Text color for the value (e.g., 'success.main', '#2e7d32') */
    valueColor?: string;
    /** Loading state - shows '...' when true */
    loading?: boolean;
    /** Optional custom styles for the card */
    sx?: object;
}

/**
 * Reusable KPI Card Component
 * Displays a metric with optional icon, customizable colors, and loading state
 */
const KPICard: React.FC<KPICardProps> = ({
    label,
    value,
    icon,
    iconBgColor = 'primary.main',
    bgColor,
    valueColor,
    loading = false,
    sx = {},
}) => {
    // Default light background colors if not provided
    const defaultBgColor = bgColor || '#f5f5f5';
    
    return (
        <Card
            sx={{
                height: '100%',
                bgcolor: defaultBgColor,
                background: bgColor 
                    ? `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`
                    : 'linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: iconBgColor || 'primary.main',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '&:hover': {
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px ${iconBgColor || 'primary.main'}20`,
                    transform: 'translateY(-4px) scale(1.02)',
                    bgcolor: bgColor 
                        ? undefined 
                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    '&::before': {
                        transform: 'scaleX(1)',
                    },
                    '& .kpi-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: `0 8px 20px ${iconBgColor || 'primary.main'}60`,
                    },
                },
                ...sx,
            }}
        >
            <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {icon && (
                        <Avatar
                            className="kpi-icon"
                            sx={{
                                bgcolor: iconBgColor,
                                width: 56,
                                height: 56,
                                boxShadow: `0 4px 12px ${iconBgColor}40`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            {icon}
                        </Avatar>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'block',
                                mb: 0.5,
                                transition: 'color 0.3s ease',
                            }}
                        >
                            {label}
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                fontSize: '1.75rem',
                                color: valueColor || 'text.primary',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                transition: 'color 0.3s ease, transform 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                },
                            }}
                        >
                            {loading ? '...' : value}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default KPICard;
