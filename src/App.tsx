import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './globals.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UserList from './pages/users/UserList';
import NewUserForm from './pages/users/NewUserForm';
import CategoryPage from './pages/category/CategoryList';
import NewCategoryForm from './pages/category/NewCategoryForm';
import SubCategoryList from './pages/sub-category/SubCategoryList';
import NewSubCategoryForm from './pages/sub-category/NewSubCategoryForm';
import ProductList from './pages/products/ProductList';
import NewProductForm from './pages/products/NewProductForm';
import PromocodeList from './pages/promo-code/PromocodeList';
import NewPromocodeForm from './pages/promo-code/NewPromocodeForm';
import OfferList from './pages/offers/OfferList';
import NewOfferForm from './pages/offers/NewOfferForm';
import OrderList from './pages/orders/OrderList';
import LoginForm from './pages/login/LoginForm';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    {/* Login page without layout */}
                    <Route path="/login" element={<LoginForm />} />
                    
                    {/* All other pages with layout */}
                    <Route element={<Layout isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/users" element={<UserList />} />
                        <Route path="/users/new" element={<NewUserForm />} />
                        <Route path="/category" element={<CategoryPage />} />
                        <Route path="/category/new" element={<NewCategoryForm />} />
                        <Route path="/sub-category" element={<SubCategoryList />} />
                        <Route path="/sub-category/new" element={<NewSubCategoryForm />} />
                        <Route path="/products" element={<ProductList />} />
                        <Route path="/products/new" element={<NewProductForm />} />
                        <Route path="/promo-code" element={<PromocodeList />} />
                        <Route path="/promo-code/new" element={<NewPromocodeForm />} />
                        <Route path="/offers" element={<OfferList />} />
                        <Route path="/offers/new" element={<NewOfferForm />} />
                        <Route path="/orders" element={<OrderList />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
