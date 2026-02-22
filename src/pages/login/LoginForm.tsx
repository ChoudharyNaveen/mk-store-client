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
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import authService from '../../services/auth.service';
import branchService from '../../services/branch.service';
import { createEqFilter } from '../../utils/filterBuilder';
import { showSuccessToast } from '../../utils/toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAuth } from '../../store/authSlice';
import { setBranches, setSelectedBranch } from '../../store/branchSlice';

export default function LoginForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [rememberMe, setRememberMe] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authService.login({
                email: email.trim(),
                password,
            });

            if (response.doc?.token && response.doc?.user) {
                // Fetch branches after successful login
                let selectedBranchId: number | null = null;
                try {
                    const branchResponse = await branchService.getBranches({
                        pageSize: 100,
                        filters: response.doc.user.vendorId != null
                            ? [createEqFilter('vendorId', response.doc.user.vendorId)]
                            : [],
                    });
                    if (branchResponse.success && branchResponse.doc && branchResponse.doc.length > 0) {
                        // Store branches in Redux
                        dispatch(setBranches(branchResponse.doc));
                        
                        // Set first branch as default
                        selectedBranchId = branchResponse.doc[0].id;
                        dispatch(setSelectedBranch(selectedBranchId));
                    }
                } catch (branchError) {
                    // Log error but don't block login
                    console.error('Error fetching branches:', branchError);
                }
                
                // Set auth data in Redux store with branch ID
                dispatch(setAuth({
                    user: response.doc.user,
                    token: response.doc.token,
                    branchId: selectedBranchId || undefined,
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

    // Check if user is already authenticated (only after initialization)
    const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);
    
    React.useEffect(() => {
        // Only redirect if initialization is complete and user is authenticated
        if (!isInitializing && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isInitializing, navigate]);
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
                background: 'linear-gradient(145deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%)',
            }}
        >
            {/* Subtle overlay shapes */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-5%',
                    width: '50%',
                    height: '60%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '50%',
                    zIndex: 1,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-5%',
                    width: '55%',
                    height: '55%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '50%',
                    zIndex: 1,
                }}
            />

            {/* Login Card */}
            <Paper
                elevation={0}
                sx={{
                    zIndex: 10,
                    p: { xs: 3, sm: 4 },
                    width: '100%',
                    maxWidth: 420,
                    mx: 2,
                    borderRadius: 3,
                    backgroundColor: '#fff',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight={600} color="text.primary" letterSpacing="-0.02em">
                        Welcome back
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Sign in with your email and password
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                        id="email"
                        type="email"
                        fullWidth
                        required
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        variant="outlined"
                        size="medium"
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'grey.50',
                                '&:hover': { backgroundColor: 'grey.100' },
                                '&.Mui-focused': { backgroundColor: '#fff' },
                            },
                        }}
                    />

                    <Box>
                        <TextField
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                            size="medium"
                            placeholder="••••••••"
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            onMouseDown={(e) => e.preventDefault()}
                                            edge="end"
                                            disabled={loading}
                                            size="small"
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'grey.50',
                                    '&:hover': { backgroundColor: 'grey.100' },
                                    '&.Mui-focused': { backgroundColor: '#fff' },
                                },
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                            <Link href="#" underline="hover" variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Forgot password?
                            </Link>
                        </Box>
                    </Box>

                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={loading}
                                sx={{ color: 'primary.main' }}
                            />
                        }
                        label={
                            <Typography variant="body2" color="text.secondary">
                                Remember me
                            </Typography>
                        }
                        sx={{ mt: -0.5 }}
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
                            fontWeight: 600,
                            py: 1.5,
                            fontSize: '1rem',
                            borderRadius: 2,
                            boxShadow: '0 4px 14px rgba(32, 69, 100, 0.25)',
                            '&:hover': {
                                boxShadow: '0 6px 20px rgba(32, 69, 100, 0.3)',
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
