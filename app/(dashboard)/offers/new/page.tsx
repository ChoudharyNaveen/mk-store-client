'use client';

import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Select,
    FormControl,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useRouter } from 'next/navigation';

export default function NewOfferPage() {
    const router = useRouter();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                New Offer
            </Typography>

            <Grid container spacing={4}>
                {/* Row 1 */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Type</Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            defaultValue=""
                            displayEmpty
                            sx={{ borderRadius: 2, bgcolor: '#fdfdfd' }}
                        >
                            <MenuItem value="" disabled>Select Type</MenuItem>
                            <MenuItem value="Seasonal">Seasonal</MenuItem>
                            <MenuItem value="Flash Sale">Flash Sale</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Code</Typography>
                    <TextField
                        fullWidth
                        placeholder="Type here"
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Min Order Price</Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            defaultValue="Flat"
                            sx={{ borderRadius: 2, bgcolor: '#fdfdfd' }}
                        >
                            <MenuItem value="Flat">Flat</MenuItem>
                            <MenuItem value="Percentage">Percentage</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Percentage</Typography>
                    <TextField
                        fullWidth
                        placeholder="Type here"
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                    />
                </Grid>

                {/* Row 2 */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Description</Typography>
                    <TextField
                        fullWidth
                        placeholder="Type here"
                        multiline
                        rows={4}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Start Date</Typography>
                    <TextField
                        fullWidth
                        type="date"
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>End Date</Typography>
                    <TextField
                        fullWidth
                        type="date"
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                {/* Row 3 - Image Upload */}
                <Grid size={{ xs: 12, md: 6 }} offset={{ md: 6 }}>
                    <Box
                        sx={{
                            border: '1px dashed #ccc',
                            borderRadius: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            bgcolor: '#fdfdfd',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#f5f5f5' },
                            minHeight: 150
                        }}
                        component="label"
                    >
                        <input hidden accept="image/*" type="file" />
                        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
                            Upload cover image
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>
                            Drop your file here
                        </Typography>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                border: '2px solid #3f51b5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#3f51b5'
                            }}
                        >
                            <CloudUploadIcon sx={{ fontSize: 20 }} />
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 6 }}>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: '#204564',
                        color: 'white',
                        px: 6,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#1a3852' }
                    }}
                    onClick={() => router.push('/offers')}
                >
                    Submit
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: '#e0e0e0',
                        color: '#333',
                        px: 6,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#d5d5d5' }
                    }}
                    onClick={() => router.push('/offers')}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}
