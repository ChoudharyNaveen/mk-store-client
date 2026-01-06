# Configuration Guide

This directory contains configuration files for the application.

## Environment Configuration (`env.ts`)

The main configuration file that manages environment-specific settings.

### Available Configuration

#### API Configuration
- `apiBaseUrl`: Base URL for API requests
- `apiTimeout`: Request timeout in milliseconds

#### Version Check Configuration
The version checking feature can be configured per environment:

- `versionCheckInterval`: Check interval in milliseconds (default: `60000` = 60 seconds)

### Environment Variables

You can configure version checking via environment variables:

- `VITE_VERSION_CHECK_INTERVAL`: Check interval in milliseconds (default: `60000`)

### Customizing Configuration

To customize the check interval per environment, edit the `envConfig` object in `src/config/env.ts`:

```typescript
const envConfig = {
  production: {
    // ... other config
    versionCheckInterval: 60000, // Check every 60 seconds
  },
  // ... other environments
};
```

### Usage

Import and use the config in your components:

```typescript
import { config } from '@/config/env';

// Access version check interval
const checkInterval = config.versionCheckInterval;

// Access API config
const apiUrl = config.apiBaseUrl;
```

