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
    Tabs,
    Tab,
    IconButton,
    Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCategories } from '../../services/category.service';
import { fetchSubCategoriesByCategoryId } from '../../services/sub-category.service';
import { showErrorToast } from '../../utils/toast';
import type { Category } from '../../types/category';
import type { SubCategoryByCategoryIdItem } from '../../types/sub-category';
import DataTable from '../../components/DataTable';
import { useServerPagination } from '../../hooks/useServerPagination';
import type { Column } from '../../types/table';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

interface SubCategoriesTableProps {
    categoryId: number;
}

function SubCategoriesTable({ categoryId }: SubCategoriesTableProps) {
    const navigate = useNavigate();

    const columns: Column<SubCategoryByCategoryIdItem>[] = [
        {
            id: 'name',
            label: 'Name',
            minWidth: 200,
            render: (row: SubCategoryByCategoryIdItem) => (
                <Typography
                    component="button"
                    onClick={() => navigate(`/sub-category/detail/${row.id}`)}
                    sx={{
                        background: 'none',
                        border: 'none',
                        color: '#204564',
                        cursor: 'pointer',
                        textAlign: 'left',
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    {row.name}
                </Typography>
            ),
        },
        {
            id: 'products_count',
            label: 'Products',
            minWidth: 100,
            align: 'right',
            format: (value: number) => value.toLocaleString(),
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            render: (row: SubCategoryByCategoryIdItem) => (
                <Chip
                    label={row.status}
                    color={row.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            id: 'id',
            label: 'Actions',
            minWidth: 100,
            align: 'center',
            render: (row: SubCategoryByCategoryIdItem) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/sub-category/detail/${row.id}`)}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2' }
                        }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    // Create a fetch function that wraps the service call
    const fetchSubCategories = React.useCallback(
        async (params: {
            page?: number;
            pageSize?: number;
            searchKeyword?: string;
            filters?: Record<string, string | number | boolean> | Array<{ key: string; [key: string]: unknown }>;
            sorting?: Array<{ key: string; direction: 'ASC' | 'DESC' }>;
            signal?: AbortSignal;
        }) => {
            return fetchSubCategoriesByCategoryId({
                ...params,
                categoryId,
            });
        },
        [categoryId]
    );

    const {
        paginationModel,
        setPaginationModel,
        tableState,
        tableHandlers,
    } = useServerPagination<SubCategoryByCategoryIdItem>({
        fetchFunction: fetchSubCategories,
        initialPageSize: 20,
        enabled: true,
        autoFetch: true,
        filters: {},
        initialSorting: [],
        searchDebounceMs: 500,
    });

    return (
            <DataTable
                key={`sub-category-table-${paginationModel.page}-${paginationModel.pageSize}`}
                columns={columns}
                state={tableState}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
            />
    );
}

export default function CategoryDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [category, setCategory] = React.useState<Category | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [tabValue, setTabValue] = React.useState(0);
    const [overviewTabValue, setOverviewTabValue] = React.useState(0);

    React.useEffect(() => {
        const loadCategory = async () => {
            if (!id) {
                navigate('/category');
                return;
            }

            try {
                setLoading(true);
                const response = await fetchCategories({
                    filters: [{ key: 'id', eq: id }],
                    page: 0,
                    pageSize: 1,
                });

                if (response.list && response.list.length > 0) {
                    setCategory(response.list[0]);
                } else {
                    showErrorToast('Category not found');
                    navigate('/category');
                }
            } catch (error) {
                console.error('Error fetching category:', error);
                showErrorToast('Failed to load category details');
                navigate('/category');
            } finally {
                setLoading(false);
            }
        };

        loadCategory();
    }, [id, navigate]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!category) {
        return null;
    }

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE' ? 'success' : 'default';
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOverviewTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setOverviewTabValue(newValue);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/category')}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'transparent' }
                        }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                        Category Details
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/category/edit/${id}`)}
                        sx={{ textTransform: 'none' }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        sx={{
                            bgcolor: 'error.main',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'error.dark' }
                        }}
disabled={false}
                    >
                        Delete
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={3}>
                {/* Single Column - Tabs */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Overview" />
                            <Tab label="Sub-Categories" />
                        </Tabs>

                        {/* Overview Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
                                    {category.title}
                                </Typography>

                                {/* Image Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            {category.image ? (
                                <Box
                                    component="img"
                                    src={category.image}
                                    alt={category.title}
                                    sx={{
                                        width: '100%',
                                        maxWidth: 400,
                                        height: 'auto',
                                        borderRadius: 2,
                                        objectFit: 'cover',
                                    }}
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
                                    {category.title.charAt(0).toUpperCase()}
                                </Avatar>
                            )}
                        </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Chip
                                label={category.status}
                                color={getStatusColor(category.status)}
                                size="small"
                            />
                        </Box>
                        </Box>

                            {/* Nested Tabs within Overview */}
                            <Tabs value={overviewTabValue} onChange={handleOverviewTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tab label="Basic Information" />
                                <Tab label="Details" />
                                <Tab label="Metadata" />
                        </Tabs>

                            {/* Basic Information Tab */}
                            <TabPanel value={overviewTabValue} index={0}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Category ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        #{category.id}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        Status
                                    </Typography>
                                    <Chip
                                        label={category.status}
                                        color={getStatusColor(category.status)}
                                        size="small"
                                    />
                                </Grid>
                                </Grid>
                            </TabPanel>

                            {/* Details Tab */}
                            <TabPanel value={overviewTabValue} index={1}>
                                {category.description ? (
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                                            Description
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                            {category.description}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No description available.
                                    </Typography>
                                )}
                            </TabPanel>

                            {/* Metadata Tab */}
                            <TabPanel value={overviewTabValue} index={2}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No metadata available.
                                </Typography>
                            </TabPanel>
                        </TabPanel>

                        {/* Sub-Categories Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <SubCategoriesTable categoryId={category.id} />
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
