const config = {
  // Environment
  env: import.meta.env.MODE || 'development',

  // API Base URL
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

  // App Info
  appName: 'GaonConnect',
  appVersion: '1.0.0',

  // Timeouts
  apiTimeout: 10000,

  // Debug
  debug: import.meta.env.MODE === 'development',
};

export default config;
