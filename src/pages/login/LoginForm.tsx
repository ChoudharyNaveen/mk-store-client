import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import authService from '../../services/auth.service';
import { showSuccessToast } from '../../utils/toast';
import { useAppDispatch } from '../../store/hooks';
import { setAuth } from '../../store/authSlice';

export default function LoginForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [rememberMe, setRememberMe] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authService.login({
                email: email.trim(),
                password,
            });

            if (response.doc?.token && response.doc?.user) {
                // Set auth data in Redux store
                dispatch(setAuth({
                    user: response.doc.user,
                    token: response.doc.token,
                    branchId: 1, // TODO: Get branchId from API response or user data
                }));
                
                // Show success toast
                showSuccessToast('Login successful!', 'Welcome');
                // Navigate to dashboard on successful login
                navigate('/', { replace: true });
            } else {
                // This shouldn't happen, but handle it just in case
                showSuccessToast('Login failed. Please try again.', 'Error');
            }
        } catch {
            // Error toast is automatically shown by HTTP utilities
            // No need to handle it here
        } finally {
            setLoading(false);
        }
    };

    // Check if user is already authenticated
    React.useEffect(() => {
        if (authService.isAuthenticated()) {
            navigate('/', { replace: true });
        }
    }, [navigate]);
    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                // Complex gradient background to mimic the wavy pink design
                background: 'linear-gradient(135deg, #FF5277 0%, #FF1744 100%)',
            }}
        >
            {/* Decorative Wavy Background Elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    width: '60%',
                    height: '140%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '40%',
                    transform: 'rotate(25deg)',
                    zIndex: 1,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-30%',
                    right: '-10%',
                    width: '70%',
                    height: '140%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '50%',
                    transform: 'rotate(-25deg)',
                    zIndex: 1,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: '20%',
                    right: '-20%',
                    width: '50%',
                    height: '80%',
                    background: 'radial-gradient(circle, rgba(255,64,129,1) 0%, rgba(255,23,68,0) 70%)',
                    opacity: 0.6,
                    zIndex: 1,
                }}
            />

            {/* Login Card */}
            <Paper
                elevation={6}
                sx={{
                    zIndex: 10,
                    p: { xs: 3, md: 5 },
                    width: '100%',
                    maxWidth: 480, // Approximate width from image
                    borderRadius: 3,
                    backgroundColor: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h1" fontWeight="700" color="text.primary">
                        Login to Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Please enter your email and password to continue
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                        <Typography
                            variant="subtitle2"
                            component="label"
                            htmlFor="email"
                            sx={{ fontWeight: 500, display: 'block', mb: 0.5, color: '#333' }}
                        >
                            Email address:
                        </Typography>
                        <TextField
                            id="email"
                            type="email"
                            fullWidth
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@vendor.com"
                            variant="outlined"
                            size="small"
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#f5f7fa',
                                }
                            }}
                        />
                    </Box>

                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography
                                variant="subtitle2"
                                component="label"
                                htmlFor="password"
                                sx={{ fontWeight: 500, color: '#333' }}
                            >
                                Password
                            </Typography>
                            <Link href="#" underline="hover" variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Forget Password?
                            </Link>
                        </Stack>
                        <TextField
                            id="password"
                            type="password"
                            fullWidth
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                            size="small"
                            placeholder="••••••••"
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#f5f7fa',
                                }
                            }}
                        />
                    </Box>

                    <FormControlLabel
                        control={
                            <Checkbox 
                                size="small" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={loading}
                                sx={{ color: '#ccc' }} 
                            />
                        }
                        label={
                            <Typography variant="body2" color="text.secondary">
                                Remember Password
                            </Typography>
                        }
                        sx={{ mt: -1 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disableElevation
                        color="primary"
                        disabled={loading}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 'bold',
                            py: 1.5,
                            position: 'relative',
                            '&:hover': {
                                // MUI handles hover based on primary color, but we can tune if needed
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Sign In'
                        )}
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Don&apos;t have an account?{' '}
                            <Link href="#" underline="hover" sx={{ color: '#204564', fontWeight: 'bold' }}>
                                Create Account
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
