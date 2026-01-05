/**
 * Environment configuration
 * Supports: local, staging, production
 */

type Environment = 'local' | 'staging' | 'production';

const getEnvironment = (): Environment => {
  const env = import.meta.env.VITE_MY_VAR;  
  if (env === 'production' || env === 'prod') {
    return 'production';
  }
  if (env === 'staging' || env === 'stage') {
    return 'staging';
  }
  return 'local';
};

const currentEnv = getEnvironment();

const metaEnv = import.meta.env as { VITE_API_BASE_URL?: string };

const envConfig = {
  local: {
    apiBaseUrl: metaEnv.VITE_API_BASE_URL || 'http://localhost:4000/api',
    apiTimeout: 30000,
  },
  staging: {
    apiBaseUrl: metaEnv.VITE_API_BASE_URL || 'https://apionline.mkonlinestore.co.in/api',
    apiTimeout: 30000,
  },
  production: {
    apiBaseUrl: metaEnv.VITE_API_BASE_URL || 'https://apionline.mkonlinestore.co.in/api',
    apiTimeout: 30000,
  },
};

export const config = {
  env: currentEnv,
  apiBaseUrl: envConfig[currentEnv].apiBaseUrl,
  apiTimeout: envConfig[currentEnv].apiTimeout,
  isDevelopment: currentEnv === 'local',
  isProduction: currentEnv === 'production',
  isStaging: currentEnv === 'staging',
};

export default config;

