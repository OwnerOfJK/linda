/**
 * Simple API Client for Backend Communication
 * Handles platform-specific URLs for Docker containers
 */

import { API_URL, WS_URL } from '@/constants/config';

// Re-export for convenience
export { API_URL, WS_URL };

// Simple fetch wrapper
export const api = {
  get: async (endpoint: string) => {
    console.log(`🌐 API GET: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ API GET Error:`, endpoint, response.status, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API GET Response:`, endpoint, data);
    return data;
  },

  post: async (endpoint: string, data?: any) => {
    console.log(`🌐 API POST: ${API_URL}${endpoint}`, data);
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log(errorData);
    }

    const result = await response.json();
    console.log(`✅ API POST Response:`, endpoint, result);
    return result;
  },

  put: async (endpoint: string, data?: any) => {
    console.log(`🌐 API PUT: ${API_URL}${endpoint}`, data);
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ API PUT Error:`, endpoint, response.status, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ API PUT Response:`, endpoint, result);
    return result;
  },

  delete: async (endpoint: string) => {
    console.log(`🌐 API DELETE: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ API DELETE Error:`, endpoint, response.status, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API DELETE Response:`, endpoint, data);
    return data;
  },
};
