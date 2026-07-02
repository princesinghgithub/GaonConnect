const config = {
  // Environment
  env: import.meta.env.MODE || 'development',

  // API Base URL
  apiUrl: import.meta.env.VITE_API_URL || 'https://gaonconnect-backend.onrender.com/api',

  // App Info
  appName: 'GaonConnect',
  appVersion: '1.0.0',

  // Timeouts
  apiTimeout: 10000,

  // Debug
  debug: import.meta.env.MODE === 'development',
};

export default config;


// const config = {
//   // Environment
//   env: import.meta.env.MODE || "development",

//   // API Base URL
//   apiUrl:
//     import.meta.env.VITE_API_URL ||
//     "https://gaonconnect-1.onrender.com/api",

//   // App Info
//   appName: "GaonConnect",
//   appVersion: "1.0.0",

//   // Timeouts
//   apiTimeout: 10000,

//   // Debug Mode
//   debug: import.meta.env.MODE === "development",
// };

// export default config;