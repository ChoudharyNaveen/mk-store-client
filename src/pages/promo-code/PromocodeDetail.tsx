import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DiscountOutlinedIcon from '@mui/icons-material/DiscountOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPromocodeById, fetchPromocodeSummary } from '../../services/promo-code.service';
import type { Promocode, PromocodeSummary } from '../../types/promo-code';
import KPICard from '../../components/KPICard';
import { useDetailWithSummary } from '../../hooks/useDetailWithSummary';
import { format } from 'date-fns';

// Static content for How to use & terms
const PROMO_STATIC = {
  howToUse: 'Share this code with customers. They enter it at checkout to receive the discount. For percentage-based codes, the discount applies to the order subtotal; for flat codes, the fixed amount is deducted.',
  terms: [
    'Valid only between the start and end dates shown above',
    'One use per customer unless otherwise configured',
    'Cannot be combined with other promo codes unless allowed by your settings',
  ],
};

export default function PromocodeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { entity: promocode, summary, loading, summaryLoading } = useDetailWithSummary<Promocode, PromocodeSummary>({
    id,
    navigate,
    redirectPath: '/promo-code',
    entityName: 'promo code',
    fetchEntity: fetchPromocodeById,
    fetchSummary: fetchPromocodeSummary,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!promocode) {
    return null;
  }

  const startDate = (promocode as { start_date?: string; startDate?: string }).start_date ?? (promocode as { start_date?: string; startDate?: string }).startDate;
  const endDate = (promocode as { end_date?: string; endDate?: string }).end_date ?? (promocode as { end_date?: string; endDate?: string }).endDate;
  const createdAt = (promocode as { created_at?: string; createdAt?: string }).created_at ?? (promocode as { created_at?: string; createdAt?: string }).createdAt;

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
                '&:hover': { bgcolor: 'transparent' }
              }}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {promocode.code || 'Promo Code'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/promo-code/edit/${id}`)}
            sx={{ textTransform: 'none' }}
          >
            Edit
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Promo Code Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{promocode.id}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Code</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{promocode.code}</Typography>
                </Grid>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{promocode.type}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={promocode.status}
                      size="small"
                      color={promocode.status === 'ACTIVE' ? 'success' : 'default'}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Grid>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{promocode.description || '—'}</Typography>
                </Grid>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Percentage</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{promocode.percentage}%</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Discount</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{promocode.discount ?? promocode.percentage}</Typography>
                </Grid>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Start date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {startDate ? format(new Date(startDate), 'MMM dd, yyyy') : '—'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">End date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {endDate ? format(new Date(endDate), 'MMM dd, yyyy') : '—'}
                  </Typography>
                </Grid>
                {createdAt && (
                  <>
                    <Divider sx={{ width: '100%', my: 1 }} />
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Created</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {format(new Date(createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Quick stats – from get-Promocode-summary API */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick stats
              </Typography>
              <Grid container spacing={2}>
                {[
                  {
                    label: 'Total redemptions',
                    value: summary != null ? summary.totalRedemptions : '—',
                    icon: <ConfirmationNumberOutlinedIcon />,
                    iconBgColor: '#1976d2',
                    bgColor: '#e3f2fd',
                  },
                  {
                    label: 'Total discounts given',
                    value: summary != null ? `₹${Number(summary.totalDiscountsGiven).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—',
                    icon: <DiscountOutlinedIcon />,
                    iconBgColor: '#2e7d32',
                    bgColor: '#e8f5e9',
                    valueColor: '#2e7d32',
                  },
                ].map((kpi, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6 }}>
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
            </CardContent>
          </Card>

          {/* How to use & terms – static info */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                How to use
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {PROMO_STATIC.howToUse}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Terms</Typography>
              <List dense disablePadding>
                {PROMO_STATIC.terms.map((text, idx) => (
                  <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Paper>
    </Box>
  );
}
