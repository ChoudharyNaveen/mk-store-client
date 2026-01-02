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
import { useRouter } from 'next/navigation';

export default function NewPromocodePage() {
    const router = useRouter();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                New Promocode
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
                            <MenuItem value="Percentage">Percentage</MenuItem>
                            <MenuItem value="Flat">Flat</MenuItem>
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
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Type</Typography>
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
                    onClick={() => router.push('/promocode')}
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
                    onClick={() => router.push('/promocode')}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}
