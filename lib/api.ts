import { config } from './config';
import type { AuthResponse, User, Attendance, Office } from '@/types';

const API_URL = config.apiUrl;

// Get token from localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Set token to localStorage
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

// Remove token from localStorage
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// Base fetch with auth header
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge with custom headers
  if (options.headers) {
    const customHeaders = options.headers as Record<string, string>;
    Object.assign(headers, customHeaders);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth API
export const authAPI = {
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: string;
    badgeNumber?: string;
    department?: string;
  }): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.success && data.data?.token) {
      setToken(data.data.token);
    }
    return data;
  },

  login: async (credentials: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.success && data.data?.token) {
      setToken(data.data.token);
    }
    return data;
  },

  logout: (): void => {
    removeToken();
  },

  sendOTP: async (email: string): Promise<{
    success: boolean;
    message: string;
    expiresIn: string;
  }> => {
    return apiFetch('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOTP: async (email: string, code: string): Promise<{
    success: boolean;
    message: string;
    email: string;
  }> => {
    return apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },
};

// User API
export const userAPI = {
  getAll: async (params?: {
    role?: string;
    isActive?: boolean;
  }): Promise<{ success: boolean; data: { users: User[]; total: number } }> => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.isActive !== undefined)
      query.append('isActive', String(params.isActive));

    return apiFetch(`/api/users?${query.toString()}`);
  },

  getById: async (id: string): Promise<{ success: boolean; data: { user: User } }> => {
    return apiFetch(`/api/users/${id}`);
  },

  update: async (
    id: string,
    updates: Partial<User>
  ): Promise<{ success: boolean; data: { user: User }; message: string }> => {
    return apiFetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Attendance API
export const attendanceAPI = {
  checkIn: async (data: {
    officeId: string;
    lat: number;
    lng: number;
  }): Promise<{
    success: boolean;
    data: {
      id: string;
      userId: string;
      officeId: string;
      officerName: string;
      officeName: string;
      distance: number;
      status: 'Valid' | 'Invalid';
      timestamp: Date;
      message: string;
    };
  }> => {
    return apiFetch('/api/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRecords: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: 'Valid' | 'Invalid';
    userId?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    success: boolean;
    data: {
      records: Attendance[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    };
  }> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.status) query.append('status', params.status);
    if (params?.userId) query.append('userId', params.userId);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.page) query.append('page', String(params.page));

    return apiFetch(`/api/attendance?${query.toString()}`);
  },
};

// Office API
export const officeAPI = {
  getAll: async (params?: {
    isActive?: boolean;
  }): Promise<{ success: boolean; data: { offices: Office[]; total: number } }> => {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined)
      query.append('isActive', String(params.isActive));

    return apiFetch(`/api/offices?${query.toString()}`);
  },

  getById: async (id: string): Promise<{ success: boolean; data: { office: Office } }> => {
    return apiFetch(`/api/offices/${id}`);
  },

  create: async (officeData: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
    radius?: number;
    description?: string;
    isActive?: boolean;
  }): Promise<{ success: boolean; data: { office: Office }; message: string }> => {
    return apiFetch('/api/offices', {
      method: 'POST',
      body: JSON.stringify(officeData),
    });
  },

  update: async (
    id: string,
    updates: Partial<Office>
  ): Promise<{ success: boolean; data: { office: Office }; message: string }> => {
    return apiFetch(`/api/offices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/api/offices/${id}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  attendance: attendanceAPI,
  office: officeAPI,
};
