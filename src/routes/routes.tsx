import { RouteObject } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import UserList from '../pages/users/UserList';
import NewUserForm from '../pages/users/NewUserForm';
import ProfileSettingsPage from '../pages/users/ProfileSettingsPage';
import UserDetail from '../pages/users/UserDetail';
import CategoryPage from '../pages/category/CategoryList';
import NewCategoryForm from '../pages/category/NewCategoryForm';
import CategoryDetail from '../pages/category/CategoryDetail';
import SubCategoryList from '../pages/sub-category/SubCategoryList';
import NewSubCategoryForm from '../pages/sub-category/NewSubCategoryForm';
import SubCategoryDetail from '../pages/sub-category/SubCategoryDetail';
import BrandList from '../pages/brands/BrandList';
import BrandDetail from '../pages/brands/BrandDetail';
import NewBrandForm from '../pages/brands/NewBrandForm';
import ProductList from '../pages/products/ProductList';
import NewProductForm from '../pages/products/NewProductForm';
import ProductDetail from '../pages/products/ProductDetail';
import PromocodeList from '../pages/promo-code/PromocodeList';
import PromocodeDetail from '../pages/promo-code/PromocodeDetail';
import NewPromocodeForm from '../pages/promo-code/NewPromocodeForm';
import OfferList from '../pages/offers/OfferList';
import OfferDetail from '../pages/offers/OfferDetail';
import NewOfferForm from '../pages/offers/NewOfferForm';
import OrderList from '../pages/orders/OrderList';
import OrderDetail from '../pages/orders/OrderDetail';
import LoginForm from '../pages/login/LoginForm';
import BannerList from '../pages/banners/BannerList';
import BannerForm from '../pages/banners/BannerForm';
import BannerDetail from '../pages/banners/BannerDetail';
import ShippingCharges from '../pages/settings/ShippingCharges';
import NotificationList from '../pages/notifications/NotificationList';
import ProductTypeList from '../pages/product-type/ProductTypeList';
import ProductTypeForm from '../pages/product-type/ProductTypeForm';

/**
 * Public routes (accessible without authentication)
 */
export const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginForm />,
  },
];

/**
 * Protected routes (require authentication)
 */
export const protectedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Dashboard />,
  },
  // Users routes
  {
    path: '/users',
    element: <UserList />,
  },
  {
    path: '/users/new',
    element: <NewUserForm />,
  },
  {
    path: '/users/detail/:id',
    element: <UserDetail />,
  },
  {
    path: '/users/:id',
    element: <ProfileSettingsPage />,
  },
  // Category routes
  {
    path: '/category',
    element: <CategoryPage />,
  },
  {
    path: '/category/new',
    element: <NewCategoryForm />,
  },
  {
    path: '/category/edit/:id',
    element: <NewCategoryForm />,
  },
  {
    path: '/category/detail/:id',
    element: <CategoryDetail />,
  },
  // Sub-category routes
  {
    path: '/sub-category',
    element: <SubCategoryList />,
  },
  {
    path: '/sub-category/new',
    element: <NewSubCategoryForm />,
  },
  {
    path: '/sub-category/edit/:id',
    element: <NewSubCategoryForm />,
  },
  {
    path: '/sub-category/detail/:id',
    element: <SubCategoryDetail />,
  },
  // Brand routes
  {
    path: '/brands',
    element: <BrandList />,
  },
  {
    path: '/brands/new',
    element: <NewBrandForm />,
  },
  {
    path: '/brands/detail/:id',
    element: <BrandDetail />,
  },
  {
    path: '/brands/edit/:id',
    element: <NewBrandForm />,
  },
  // Product routes
  {
    path: '/products',
    element: <ProductList />,
  },
  {
    path: '/products/new',
    element: <NewProductForm />,
  },
  {
    path: '/products/edit/:id',
    element: <NewProductForm />,
  },
  {
    path: '/products/detail/:id',
    element: <ProductDetail />,
  },
  // Promo code routes
  {
    path: '/promo-code',
    element: <PromocodeList />,
  },
  {
    path: '/promo-code/new',
    element: <NewPromocodeForm />,
  },
  {
    path: '/promo-code/detail/:id',
    element: <PromocodeDetail />,
  },
  {
    path: '/promo-code/edit/:id',
    element: <NewPromocodeForm />,
  },
  // Offer routes
  {
    path: '/offers',
    element: <OfferList />,
  },
  {
    path: '/offers/new',
    element: <NewOfferForm />,
  },
  {
    path: '/offers/detail/:id',
    element: <OfferDetail />,
  },
  {
    path: '/offers/edit/:id',
    element: <NewOfferForm />,
  },
  // Order routes
  {
    path: '/orders',
    element: <OrderList />,
  },
  {
    path: '/orders/detail/:id',
    element: <OrderDetail />,
  },
  {
    path: '/orders/edit/:id',
    element: <OrderList />, // TODO: Create OrderEdit component
  },
  // Notifications
  {
    path: '/notifications',
    element: <NotificationList />,
  },
  // Banner routes
  {
    path: '/banners',
    element: <BannerList />,
  },
  {
    path: '/banners/new',
    element: <BannerForm />,
  },
  {
    path: '/banners/edit/:id',
    element: <BannerForm />,
  },
  {
    path: '/banners/detail/:id',
    element: <BannerDetail />,
  },
  // Product type routes
  {
    path: '/product-types',
    element: <ProductTypeList />,
  },
  {
    path: '/product-types/new',
    element: <ProductTypeForm />,
  },
  {
    path: '/product-types/edit/:id',
    element: <ProductTypeForm />,
  },
  // Settings routes
  {
    path: '/settings/shipping-charges',
    element: <ShippingCharges />,
  },
];

