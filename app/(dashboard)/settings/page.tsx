'use client';

import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Avatar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Grid,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export default function SettingsPage() {
    return (
        <Box sx={{ p: 4, bgcolor: '#f5f7fb', minHeight: '100vh' }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, color: '#333', fontSize: '1.75rem' }}>
                Profile Settings
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, md: 6 },
                    borderRadius: 4,
                    bgcolor: 'white',
                    border: '1px solid #e0e0e0',
                    maxWidth: 1000,
                    mx: 'auto'
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                bgcolor: '#f0f2f5',
                                color: '#666',
                                border: '1px solid #e0e0e0'
                            }}
                        >
                            <PhotoCameraIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2,
                            color: 'primary.main',
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                        }}
                    >
                        Upload Photo
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.9rem' }}>First Name</Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your first name"
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#fdfdfd',
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.9rem' }}>Your email</Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your email"
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#fdfdfd',
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'primary.main',
                                            borderWidth: '2px'
                                        }
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.9rem' }}>Date of Birth</Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your birthdate"
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#fdfdfd',
                                    }
                                }}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.9rem' }}>Last Name</Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your last name"
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#fdfdfd',
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.9rem' }}>Phone Number</Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your phone number"
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#fdfdfd',
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.9rem' }}>Gender</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    defaultValue="Male"
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: '#fdfdfd',
                                    }}
                                >
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: '#204564',
                            color: 'white',
                            px: 10,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            '&:hover': { bgcolor: '#1a3852' }
                        }}
                    >
                        Update Profile
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
