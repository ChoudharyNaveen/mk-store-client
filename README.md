# MK Store Client

A modern e-commerce store management admin dashboard built with React, Vite, TypeScript, and Material-UI.

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **Emotion** - CSS-in-JS styling

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build

Build for production:

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Environment Configuration

The application supports multiple environments: `local`, `staging`, and `production`.

### Environment Variables

Create a `.env.local`, `.env.staging`, or `.env.production` file in the root directory:

```bash
# API Base URL
VITE_API_BASE_URL=https://apionline.mkonlinestore.co.in/api
```

### Environment Detection

- **Local**: Default when running `npm run dev` (MODE=development)
- **Staging**: Set `VITE_ENV=staging` or use `MODE=staging`
- **Production**: Set `VITE_ENV=production` or use `MODE=production`

The environment is automatically detected based on Vite's `MODE` or the `VITE_ENV` variable.

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Layout.tsx      # Main layout with sidebar and header
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Header.tsx      # Top header bar
│   └── DataTable.tsx   # Data table component
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── users/          # User management
│   ├── category/       # Category management
│   ├── sub-category/   # Sub-category management
│   ├── products/       # Product management
│   ├── promo-code/     # Promocode management
│   ├── offers/         # Offers management
│   ├── orders/         # Orders management
│   └── login/          # Login page
├── hooks/              # Custom React hooks
│   └── useTable.ts     # Table data management hook
├── types/              # TypeScript type definitions
│   ├── table.ts
│   └── auth.ts         # Authentication types
├── config/             # Configuration files
│   └── env.ts          # Environment configuration
├── constants/          # Application constants
│   └── urls.ts         # API URL constants
├── utils/              # Utility functions
│   └── http.ts         # HTTP client utilities
├── services/           # API service layer
│   └── auth.service.ts # Authentication service
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
├── theme.ts            # MUI theme configuration
└── globals.css         # Global styles
```

## API Integration

### HTTP Utilities

The application uses a centralized HTTP utility (`src/utils/http.ts`) that provides:

- Automatic token management
- Request/response interceptors
- Error handling
- Timeout management
- Automatic redirect on 401 errors

### Services

Entity-wise services are organized in the `src/services/` directory:

- **auth.service.ts**: Authentication operations (login, logout)

### URL Constants

All API endpoints are centralized in `src/constants/urls.ts` for easy maintenance.

### Usage Example

```typescript
import authService from '@/services/auth.service';

// Login
const response = await authService.login({
  email: 'admin@vendor.com',
  password: 'SecurePassword123'
});

// Check authentication
if (authService.isAuthenticated()) {
  // User is logged in
}
```

## Available Routes

- `/` - Dashboard
- `/users` - User List
- `/users/new` - New User Form
- `/category` - Category List
- `/category/new` - New Category Form
- `/sub-category` - Sub Category List
- `/sub-category/new` - New Sub Category Form
- `/products` - Product List
- `/products/new` - New Product Form
- `/promo-code` - Promocode List
- `/promo-code/new` - New Promocode Form
- `/offers` - Offers List
- `/offers/new` - New Offer Form
- `/orders` - Orders List
- `/login` - Login Page

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

Private project
