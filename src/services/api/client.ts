/**
 * API Client
 *
 * Centralized Axios instance with interceptors for auth headers,
 * error handling, and request/response logging in development.
 */

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {useAuthStore} from '@store/authStore';

// TODO: Load from environment variables in Phase 8
const BASE_URL = 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach Auth Token ─────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ── Response Interceptor: Handle Errors ────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — force logout
      useAuthStore.getState().logout();
    }

    if (__DEV__) {
      console.error(
        `[API Error] ${error.response?.status} ${error.config?.url}`,
        error.response?.data,
      );
    }

    return Promise.reject(error);
  },
);

// ── Typed API Helpers ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
