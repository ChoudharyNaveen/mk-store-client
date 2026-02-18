import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  List,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBrandById, fetchBrandSummary } from '../../services/brand.service';
import type { Brand, BrandSummary } from '../../types/brand';
import KPICard from '../../components/KPICard';
import { useDetailWithSummary } from '../../hooks/useDetailWithSummary';
import { format } from 'date-fns';

// Static data for usage section only (stats from get-brand-summary API)
const BRAND_STATIC = {
  usageNote: 'This brand can be assigned to products when creating or editing a product. Products under this brand appear in the store under the same brand name.',
  whereUsed: [
    'Assign to products from the Products list',
    'Filter products by brand in the catalog',
    'Displayed on product cards and detail pages',
  ],
};

export default function BrandDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { entity: brand, summary, loading, summaryLoading } = useDetailWithSummary<Brand, BrandSummary>({
    id,
    navigate,
    redirectPath: '/brands',
    entityName: 'brand',
    fetchEntity: fetchBrandById,
    fetchSummary: fetchBrandSummary,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!brand) {
    return null;
  }

  const imageUrl = brand.logo || brand.image || '';
  const createdAt = brand.createdAt ?? brand.created_at;

  const getStatusColor = (status: string) => (status === 'ACTIVE' ? 'success' : 'default');

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                '&:hover': { bgcolor: 'transparent' },
              }}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
              {brand.name || 'Brand'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/brands/edit/${id}`)}
              sx={{ textTransform: 'none' }}
            >
              Edit
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ mb: 3 }}>
            {/* Logo Section - centered like SubCategory image */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  {imageUrl ? (
                    <Avatar
                      src={imageUrl}
                      alt={brand.name}
                      variant="rounded"
                      sx={{
                        width: '100%',
                        maxWidth: 400,
                        height: 200,
                        borderRadius: 2,
                        objectFit: 'contain',
                      }}
                      imgProps={{ onError: () => {} }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 200,
                        height: 200,
                        bgcolor: '#e0e0e0',
                        fontSize: '3rem',
                      }}
                    >
                      {brand.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Chip
                    label={brand.status}
                    color={getStatusColor(brand.status)}
                    size="small"
                  />
                </Box>
              </Box>

              {/* Stat cards - match SubCategoryDetail Reports cards */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  {
                    label: 'Products using this brand',
                    value: summary != null ? summary.totalProducts : '—',
                    icon: <Inventory2OutlinedIcon />,
                    iconBgColor: '#1976d2',
                    bgColor: '#e3f2fd',
                  },
                  {
                    label: 'Active products',
                    value: summary != null ? summary.activeProducts : '—',
                    icon: <CheckCircleOutlinedIcon />,
                    iconBgColor: '#2e7d32',
                    bgColor: '#e8f5e9',
                    valueColor: '#2e7d32',
                  },
                  {
                    label: 'Created',
                    value: createdAt ? format(new Date(createdAt), 'MMM dd, yyyy') : '—',
                    icon: <EventOutlinedIcon />,
                    iconBgColor: '#616161',
                    bgColor: '#f5f5f5',
                  },
                ].map((kpi, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <KPICard
                      label={kpi.label}
                      value={kpi.value}
                      icon={kpi.icon}
                      iconBgColor={kpi.iconBgColor}
                      bgColor={kpi.bgColor}
                      valueColor={kpi.valueColor}
                      loading={summaryLoading}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Single section: Basic info + Description + Created + Where used */}
              <Box sx={{ pt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                  Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Brand ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      #{brand.id}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {brand.name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Status
                    </Typography>
                    <Chip
                      label={brand.status}
                      color={getStatusColor(brand.status)}
                      size="small"
                    />
                  </Grid>
                  {createdAt && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Created At
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {format(new Date(createdAt), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                  {brand.description || 'No description available.'}
                </Typography>

                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: '#333' }}>
                  <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  Where this brand is used
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {BRAND_STATIC.usageNote}
                </Typography>
                <List dense disablePadding>
                  {BRAND_STATIC.whereUsed.map((text, idx) => (
                    <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
      </Paper>
    </Box>
  );
}
