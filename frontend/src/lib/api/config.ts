export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verify: '/auth/verify',
    login: '/auth/login',
    forgot: '/auth/forgot-password',
    reset: '/auth/reset-password',
    logout: '/auth/logout',
    resend: '/auth/resend-verification',
  },
} as const;
