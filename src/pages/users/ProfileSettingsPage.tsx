import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    Paper,
    CircularProgress,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUsers, updateUser } from '../../services/user.service';
import type { User } from '../../types/user';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

export default function ProfileSettingsPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const hasFetchedRef = useRef(false);
    
    const [user, setUser] = useState<User | null>(null);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: 'Male',
    });
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch user data on mount
    useEffect(() => {
        const loadUser = async () => {
            if (!id || hasFetchedRef.current) {
                return;
            }

            hasFetchedRef.current = true;

            try {
                setFetchingUser(true);
                const response = await fetchUsers({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    const userData = response.list[0];
                    setUser(userData);
                    
                    // Parse name if it's a full name
                    const nameParts = userData.name ? userData.name.split(' ') : ['', ''];
                    setFormData({
                        firstName: nameParts[0] || '',
                        lastName: nameParts.slice(1).join(' ') || '',
                        email: userData.email || '',
                        phoneNumber: userData.mobileNumber || userData.phone || '',
                        dateOfBirth: '',
                        gender: 'Male',
                    });

                    // Profile image can be set via upload, not from API response
                } else {
                    showErrorToast('User not found');
                    navigate('/users');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                showErrorToast('Failed to load user data');
                navigate('/users');
            } finally {
                setFetchingUser(false);
            }
        };

        loadUser();
    }, [id, navigate]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateUser(user.id, {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: formData.phoneNumber,
                updatedBy: user.id,
                concurrencyStamp: user.concurrencyStamp || '',
            });
            showSuccessToast('Profile updated successfully!');
            navigate('/users');
        } catch (error) {
            console.error('Error saving profile:', error);
            showErrorToast('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingUser) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <IconButton
                    onClick={() => navigate('/users')}
                    sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 500, color: '#333', fontSize: '1.75rem' }}>
                    Profile Settings
                </Typography>
            </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={profileImage || undefined}
                            sx={{
                                width: 120,
                                height: 120,
                                bgcolor: '#f5f5f5',
                                color: '#ccc',
                                border: '2px solid #e0e0e0',
                            }}
                        >
                            {!profileImage && <PhotoCamera sx={{ fontSize: 40 }} />}
                        </Avatar>
                        <IconButton
                            color="primary"
                            aria-label="upload picture"
                            component="label"
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                bgcolor: 'white',
                                border: '2px solid #e0e0e0',
                                width: 36,
                                height: 36,
                                '&:hover': { bgcolor: '#f5f5f5' },
                            }}
                        >
                            <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                            <PhotoCamera sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2,
                            color: 'primary.main',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                        onClick={() => {
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if (fileInput) fileInput.click();
                        }}
                    >
                        Upload Photo
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>
                                First Name
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your first name"
                                size="small"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f9fafb',
                                    },
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>
                                Last Name
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your last name"
                                size="small"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f9fafb',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>
                                Your email
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your email"
                                size="small"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f9fafb',
                                    },
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>
                                Phone Number
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your phone number"
                                size="small"
                                value={formData.phoneNumber}
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f9fafb',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>
                                Date of Birth
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter your birthdate"
                                size="small"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f9fafb',
                                    },
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ mb: 1, fontWeight: 500, color: '#555', fontSize: '0.9rem' }}>
                                Gender
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={formData.gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: '#f9fafb',
                                    }}
                                >
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                        sx={{
                            bgcolor: '#204564',
                            color: 'white',
                            px: 8,
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#1a3852' },
                            '&:disabled': {
                                bgcolor: '#ccc',
                                color: '#fff',
                            },
                        }}
                    >
                        {loading ? 'Saving...' : 'Update Profile'}
                    </Button>
                </Box>
        </Paper>
    );
}
