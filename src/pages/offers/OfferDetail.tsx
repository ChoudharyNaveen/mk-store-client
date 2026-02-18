import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
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
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchOfferById, fetchOfferSummary } from '../../services/offer.service';
import type { Offer, OfferSummary } from '../../types/offer';
import KPICard from '../../components/KPICard';
import { useDetailWithSummary } from '../../hooks/useDetailWithSummary';
import { format } from 'date-fns';

// Static content for How to use & terms
const OFFER_STATIC = {
  howToUse: 'Customers can apply this offer at checkout by entering the offer code. The discount is applied when the order total meets the minimum order value.',
  terms: [
    'Valid only within the start and end dates shown above',
    'Minimum order value must be met for the discount to apply',
    'One offer per order unless otherwise configured',
  ],
};

export default function OfferDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { entity: offer, summary, loading, summaryLoading } = useDetailWithSummary<Offer, OfferSummary>({
    id,
    navigate,
    redirectPath: '/offers',
    entityName: 'offer',
    fetchEntity: fetchOfferById,
    fetchSummary: fetchOfferSummary,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!offer) {
    return null;
  }

  const imageUrl = offer.image || '';
  const startDate = offer.start_date;
  const endDate = offer.end_date;
  const createdAt = (offer as Offer & { created_at?: string }).created_at ?? (offer as Offer & { createdAt?: string }).createdAt;

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
              {offer.code || 'Offer'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/offers/edit/${id}`)}
            sx={{ textTransform: 'none' }}
          >
            Edit
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mt: 3 }}>
        {imageUrl && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Offer Image
                </Typography>
                <Avatar
                  src={imageUrl}
                  alt={offer.code}
                  variant="rounded"
                  sx={{ width: '100%', maxWidth: 280, height: 200, objectFit: 'contain' }}
                  imgProps={{ onError: () => {} }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid size={{ xs: 12, md: imageUrl ? 7 : 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Offer Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{offer.id}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Code</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{offer.code}</Typography>
                </Grid>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{offer.type}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={offer.status}
                      size="small"
                      color={offer.status === 'ACTIVE' ? 'success' : 'default'}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Grid>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{offer.description || '—'}</Typography>
                </Grid>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Min order price</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{offer.min_order_price}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Percentage</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{offer.percentage}%</Typography>
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

          {/* Quick stats – from get-offer-summary API */}
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
                    icon: <LocalOfferOutlinedIcon />,
                    iconBgColor: '#1976d2',
                    bgColor: '#e3f2fd',
                  },
                  {
                    label: 'Total discounts given',
                    value: summary != null ? `₹${Number(summary.totalDiscountsGiven).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—',
                    icon: <ShoppingCartOutlinedIcon />,
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
                {OFFER_STATIC.howToUse}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Terms</Typography>
              <List dense disablePadding>
                {OFFER_STATIC.terms.map((text, idx) => (
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
