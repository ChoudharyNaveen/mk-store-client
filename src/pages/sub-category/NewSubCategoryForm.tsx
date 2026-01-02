

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
import { useNavigate } from 'react-router-dom';

export default function NewSubCategoryPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                New Sub Category
            </Typography>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
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
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Title</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type here"
                            variant="outlined"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        />
                    </Box>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, color: '#333' }}>Description</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type here"
                            variant="outlined"
                            multiline
                            rows={4}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fdfdfd' } }}
                        />
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ mb: 1, fontWeight: 500, color: '#333', visibility: 'hidden' }}>Spacer</Typography>
                        <Box
                            sx={{
                                flexGrow: 1,
                                border: '1px dashed #ccc',
                                borderRadius: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 4,
                                bgcolor: '#fdfdfd',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#f5f5f5' },
                                minHeight: 250
                            }}
                            component="label"
                        >
                            <input hidden accept="image/*" type="file" />
                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                                Upload cover image
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
                                Drop your file here
                            </Typography>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    border: '2px solid #3f51b5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#3f51b5'
                                }}
                            >
                                <CloudUploadIcon />
                            </Box>
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
                    onClick={() => navigate('/subcategory')}
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
                    onClick={() => navigate('/subcategory')}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}
