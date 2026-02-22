import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse, Grid } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import KPICard from './KPICard';

export interface KPIItem {
  label: string;
  value: string | number;
  helperText?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  bgColor?: string;
  valueColor?: string;
}

export interface CollapsibleKPISectionProps {
  /** List of KPI items to display */
  kpis: KPIItem[];
  /** Optional summary/helper text shown above the section */
  summaryText?: string;
  /** Loading state for all cards */
  loading?: boolean;
  /** Initial expanded state (default: true) */
  defaultExpanded?: boolean;
  /** Custom styles for KPI cards when expanded (passed to each KPICard sx) */
  cardSx?: object;
}

export default function CollapsibleKPISection({
  kpis,
  summaryText,
  loading = false,
  defaultExpanded = true,
  cardSx = {},
}: CollapsibleKPISectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const defaultCardSx = {
    '& .MuiCardContent-root': { p: 1.5 },
    '& .kpi-icon': { width: 40, height: 40, '& > svg': { fontSize: 20 } },
    '& .MuiTypography-h5': { fontSize: '1.25rem' },
    ...cardSx,
  };

  const toggle = () => setExpanded((e) => !e);

  return (
    <Box sx={{ px: 2.5, pt: 2 }}>
      {expanded && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          {summaryText && (
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
              {summaryText}
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={toggle}
            aria-label="Collapse stats"
            sx={{ p: 0.25, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
          >
            <ExpandLessIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Collapse in={expanded}>
        <Grid container spacing={1.5}>
          {kpis.map((kpi, index) => (
            <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
              <KPICard
                label={kpi.label}
                value={kpi.value}
                helperText={kpi.helperText}
                icon={kpi.icon}
                iconBgColor={kpi.iconBgColor}
                bgColor={kpi.bgColor}
                valueColor={kpi.valueColor}
                loading={loading}
                sx={defaultCardSx}
              />
            </Grid>
          ))}
        </Grid>
      </Collapse>

      {!expanded && (
        <Box
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
          aria-label="Expand stats"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            py: 1,
            px: 1.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          {kpis.map((kpi, index) => (
            <Box
              key={index}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: 'background.paper',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {kpi.icon && (
                <Box sx={{ color: kpi.iconBgColor || 'primary.main', display: 'flex', alignItems: 'center', '& svg': { fontSize: 18 } }}>
                  {kpi.icon}
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {kpi.label}:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: kpi.valueColor || 'text.primary' }}>
                {loading ? '...' : kpi.value}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', color: 'text.secondary' }}>
            <ExpandMoreIcon fontSize="small" />
          </Box>
        </Box>
      )}
    </Box>
  );
}
