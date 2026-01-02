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
│   └── table.ts
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
├── theme.ts            # MUI theme configuration
└── globals.css         # Global styles
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
