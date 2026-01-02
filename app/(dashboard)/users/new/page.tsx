'use client';

import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Avatar,
    IconButton,
    MenuItem,
    Select,
    FormControl,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useRouter } from 'next/navigation';

export default function NewUserPage() {
    const router = useRouter();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                New User
            </Typography>

            <Paper sx={{ p: 6, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            sx={{ width: 100, height: 100, bgcolor: '#f5f5f5', color: '#ccc' }}
                        >
                            <PhotoCamera sx={{ fontSize: 32 }} />
                        </Avatar>
                        <IconButton
                            color="primary"
                            aria-label="upload picture"
                            component="label"
                            sx={{
                                position: 'absolute',
                                bottom: -5,
                                right: -5,
                                bgcolor: 'white',
                                border: '1px solid #e0e0e0',
                                width: 32,
                                height: 32,
                                '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                        >
                            <input hidden accept="image/*" type="file" />
                            <PhotoCamera sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 2, color: 'primary.main', cursor: 'pointer', fontWeight: 500 }}>
                        Upload Photo
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>First Name</Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter your first name"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>Last Name</Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter your last name"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>Your email</Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter your email"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>Phone Number</Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter your phone number"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>Date of Birth</Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter your birthdate"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>Gender</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                defaultValue="Male"
                                sx={{ borderRadius: 2, bgcolor: '#f9fafb' }}
                            >
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: '#204564',
                            color: 'white',
                            px: 8,
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#1a3852' }
                        }}
                        onClick={() => router.push('/users')}
                    >
                        Add User
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
