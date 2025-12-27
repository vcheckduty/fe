// Environment configuration
export const config = {
  // API Configuration (same as backend URL for Socket.io)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  
  // Headquarters location (default - should be set in .env.local)
  office: {
    latitude: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || '16.467'),
    longitude: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || '107.590'),
    name: 'Trụ sở Công an tỉnh',
    radius: 50, // meters
  },
  
  // Google Maps API
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // App settings
  app: {
    name: 'V-CHECK',
    fullName: 'HỆ THỐNG QUẢN LÝ QUÂN SỐ V-CHECK',
    version: '1.0.0',
  },
};

export default config;
