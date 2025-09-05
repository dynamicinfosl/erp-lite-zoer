import { AUTH_CODE } from '@/constants/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
}

class ApiError extends Error {
  constructor(public status: number, public errorMessage: string, public errorCode?: string) {
    super(errorMessage);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/next_api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      try {
        const errorResult = await response.json();
        console.error('Token refresh failed:', errorResult.errorMessage || 'Unknown error');
      } catch (parseError) {
        console.error('Token refresh failed: Invalid response format');
      }
      return false;
    }

    const result: ApiResponse = await response.json();
    
    if (result.success) {
      return true;
    }
    
    console.error('Token refresh failed:', result.errorMessage || 'Unknown error');
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if(currentPath === '/login') {
      return;
    }
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
  isRetry = false
): Promise<T> {
  try {
    const response = await fetch(`/next_api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const result: ApiResponse<T> = await response.json();

    if ([AUTH_CODE.TOKEN_MISSING].includes(result.errorCode || '')) {
      redirectToLogin();
    }

    if (response.status === 401 && 
        result.errorCode === AUTH_CODE.TOKEN_EXPIRED && 
        !isRetry) {
      
      if (isRefreshing && refreshPromise) {
        const refreshSuccess = await refreshPromise;
        if (refreshSuccess) {
          return apiRequest<T>(endpoint, options, true);
        } else {
          console.error('Token refresh failed, redirecting to login');
          redirectToLogin();
          throw new ApiError(401, 'Token refresh failed, redirecting to login', AUTH_CODE.TOKEN_EXPIRED);
        }
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshToken();
        
        try {
          const refreshSuccess = await refreshPromise;
          
          if (refreshSuccess) {
            return apiRequest<T>(endpoint, options, true);
          } else {
            console.error('Token refresh failed, redirecting to login');
            redirectToLogin();
            throw new ApiError(401, 'Token refresh failed, redirecting to login', AUTH_CODE.TOKEN_EXPIRED);
          }
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }
    }

    if (!response.ok || !result.success) {
      throw new ApiError(response.status, result.errorMessage || 'API request failed', result.errorCode || '');
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('API request error:', error);
    throw new ApiError(500, 'Network error or invalid response');
  }
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
export type { ApiResponse }; 