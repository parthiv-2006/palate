import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function apiRequest(endpoint, options = {}) {
  const { token } = useAuthStore.getState();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    const errorMessage = errorData.error?.message || errorData.message || `API Error: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json();
}
