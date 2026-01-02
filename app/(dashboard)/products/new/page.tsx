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

export default function NewProductPage() {
    const router = useRouter();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                New Product
            </Typography>

            <Grid container spacing={4}>
                {/* Column 1 */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Title</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type here"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        />
                    </Box>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Quantity</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type here"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        />
                    </Box>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Category</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                defaultValue=""
                                displayEmpty
                                sx={{ borderRadius: 2, bgcolor: '#fdfdfd' }}
                            >
                                <MenuItem value="" disabled>Select Category</MenuItem>
                                <MenuItem value="Vegetables">Vegetables</MenuItem>
                                <MenuItem value="Fruits">Fruits</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>

                {/* Column 2 */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Price</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type here"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        />
                    </Box>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Unit</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type here"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        />
                    </Box>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Sub Category</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                defaultValue=""
                                displayEmpty
                                sx={{ borderRadius: 2, bgcolor: '#fdfdfd' }}
                            >
                                <MenuItem value="" disabled>Select Sub Category</MenuItem>
                                <MenuItem value="Leafy">Leafy</MenuItem>
                                <MenuItem value="Root">Root</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>

                {/* Column 3 */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Selling Price</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type here"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        />
                    </Box>
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Availability Status</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                defaultValue="In stock"
                                sx={{ borderRadius: 2, bgcolor: '#fdfdfd' }}
                            >
                                <MenuItem value="In stock">In stock</MenuItem>
                                <MenuItem value="Out of stock">Out of stock</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>

                {/* Full Width Text Areas */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Description</Typography>
                    <TextField
                        fullWidth
                        placeholder="Type here"
                        multiline
                        rows={6}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Nutritional</Typography>
                    <TextField
                        fullWidth
                        placeholder="Type here"
                        multiline
                        rows={6}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                    />
                </Grid>

                {/* Image Upload Column 3 (Bottom) */}
                <Grid size={{ xs: 12, md: 4 }} offset={{ md: 8 }}>
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
                    onClick={() => router.push('/products')}
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
                    onClick={() => router.push('/products')}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}
