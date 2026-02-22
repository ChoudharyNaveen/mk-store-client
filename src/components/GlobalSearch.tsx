import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Popover,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import LayersIcon from '@mui/icons-material/Layers';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { fetchOrders } from '../services/order.service';
import { fetchProducts } from '../services/product.service';
import { fetchUsers } from '../services/user.service';
import { fetchSubCategories } from '../services/sub-category.service';
import { mergeWithDefaultFilters } from '../utils/filterBuilder';
import type { Order } from '../types/order';
import type { Product } from '../types/product';
import type { User } from '../types/user';
import type { SubCategory } from '../types/sub-category';

type SearchEntity = 'order' | 'product' | 'user' | 'subcategory';

const ENTITY_OPTIONS: { value: SearchEntity; label: string; icon: React.ReactNode }[] = [
  { value: 'order', label: 'Orders', icon: <ShoppingCartIcon fontSize="small" /> },
  { value: 'product', label: 'Products', icon: <InventoryIcon fontSize="small" /> },
  { value: 'user', label: 'Users', icon: <PeopleIcon fontSize="small" /> },
  { value: 'subcategory', label: 'Sub Categories', icon: <LayersIcon fontSize="small" /> },
];

const SEARCH_DEBOUNCE_MS = 400;

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { selectedBranchId } = useAppSelector((state) => state.branch);
  const vendorId = user?.vendorId;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState<SearchEntity>('product');
  const openRef = useRef(false);
  openRef.current = Boolean(anchorEl);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Order[] | Product[] | User[] | SubCategory[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = Boolean(anchorEl);

  const clearSearch = useCallback(() => {
    setAnchorEl(null);
    setQuery('');
    setResults([]);
  }, []);

  const handleOpen = useCallback(() => {
    setAnchorEl(wrapperRef.current);
  }, []);

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (!anchorEl) setAnchorEl(wrapperRef.current);
  }, [anchorEl]);

  const handleClose = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const handleBlur = useCallback(() => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    // Delay so that clicking a result item is processed before we clear
    blurTimeoutRef.current = setTimeout(clearSearch, 200);
  }, [clearSearch]);

  const search = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || !vendorId) {
      setResults([]);
      return;
    }

    setLoading(true);
    const filters = mergeWithDefaultFilters([], vendorId, selectedBranchId ?? undefined);

    try {
      switch (entity) {
        case 'order': {
          const res = await fetchOrders({
            page: 0,
            pageSize: 10,
            searchKeyword: trimmed,
            filters,
          });
          setResults(res.list || []);
          break;
        }
        case 'product': {
          const res = await fetchProducts({
            page: 0,
            pageSize: 10,
            searchKeyword: trimmed,
            filters,
          });
          setResults(res.list || []);
          break;
        }
        case 'user': {
          const res = await fetchUsers({
            page: 0,
            pageSize: 10,
            searchKeyword: trimmed,
            filters,
          });
          setResults(res.list || []);
          break;
        }
        case 'subcategory': {
          const res = await fetchSubCategories({
            page: 0,
            pageSize: 10,
            searchKeyword: trimmed,
            filters,
          });
          setResults(res.list || []);
          break;
        }
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, entity, vendorId, selectedBranchId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(search, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, entity, search]);

  const handleEntityChange = (_: React.MouseEvent<HTMLElement>, newEntity: SearchEntity | null) => {
    if (newEntity) setEntity(newEntity);
  };

  const getResultLabel = (item: Order | Product | User | SubCategory) => {
    switch (entity) {
      case 'order':
        return (item as Order).order_number;
      case 'product':
        return (item as Product).title;
      case 'user':
        return (item as User).name;
      case 'subcategory':
        return (item as SubCategory).title;
      default:
        return '';
    }
  };

  const getResultSecondary = (item: Order | Product | User | SubCategory) => {
    switch (entity) {
      case 'order':
        return (item as Order).status ? `Status: ${(item as Order).status}` : undefined;
      case 'product':
        return (item as Product).category?.title;
      case 'user':
        return (item as User).email;
      case 'subcategory':
        return (item as SubCategory).category?.title;
      default:
        return undefined;
    }
  };

  const handleResultClick = (item: Order | Product | User | SubCategory) => {
    const id = (item as { id: number }).id;
    switch (entity) {
      case 'order':
        navigate(`/orders/detail/${id}`);
        break;
      case 'product':
        navigate(`/products/detail/${id}`);
        break;
      case 'user':
        navigate(`/users/detail/${id}`);
        break;
      case 'subcategory':
        navigate(`/sub-category/detail/${id}`);
        break;
    }
    handleClose();
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (openRef.current) {
          setAnchorEl(null);
          setQuery('');
          setResults([]);
        } else {
          setAnchorEl(wrapperRef.current);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Box ref={wrapperRef} sx={{ width: '100%' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder="Search orders, products, users, sub categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleOpen}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'action.hover',
              fontSize: '0.9rem',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: Math.max(anchorEl?.getBoundingClientRect?.()?.width ?? 320, 320),
            maxHeight: 440,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
            Search in
          </Typography>
          <ToggleButtonGroup
            value={entity}
            exclusive
            onChange={handleEntityChange}
            size="small"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                px: 1.5,
                py: 0.75,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderColor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              },
            }}
          >
            {ENTITY_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {opt.icon}
                  {opt.label}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results found for &quot;{query}&quot;
              </Typography>
            </Box>
          )}
          {!loading && !query.trim() && (
            <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Type to search {ENTITY_OPTIONS.find((e) => e.value === entity)?.label?.toLowerCase()}
              </Typography>
            </Box>
          )}
          {!loading && results.length > 0 && (
            <List dense disablePadding>
              {results.map((item) => (
                <ListItemButton
                  key={(item as { id: number }).id}
                  onClick={() => handleResultClick(item)}
                  sx={{
                    py: 1.25,
                    px: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {ENTITY_OPTIONS.find((e) => e.value === entity)?.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={getResultLabel(item)}
                    secondary={getResultSecondary(item)}
                    primaryTypographyProps={{ fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
        <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            Press <Chip label="⌘K" size="small" sx={{ height: 20, fontSize: '0.7rem' }} /> to open search
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
