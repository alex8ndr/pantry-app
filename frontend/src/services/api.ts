import type { StorageArea, PantryItem, AreaIcon, AreaColor } from '../domain/types';

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Storage Area API calls
export const storageAreaApi = {
  getAll: () => apiCall<StorageArea[]>('/storage-areas'),
  
  getById: (id: string) => apiCall<StorageArea>(`/storage-areas/${id}`),
  
  create: (name: string, icon: AreaIcon, color: AreaColor) =>
    apiCall<StorageArea>('/storage-areas', {
      method: 'POST',
      body: JSON.stringify({ name, icon, color }),
    }),
  
  update: (id: string, updates: Partial<Omit<StorageArea, 'id'>>) =>
    apiCall<StorageArea>(`/storage-areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    apiCall<void>(`/storage-areas/${id}`, {
      method: 'DELETE',
    }),
};

// Item API calls
export const itemApi = {
  getAll: () => apiCall<PantryItem[]>('/items'),
  
  getByStorageArea: (storageAreaId: string) =>
    apiCall<PantryItem[]>(`/items?storageAreaId=${storageAreaId}`),
  
  getById: (id: string) => apiCall<PantryItem>(`/items/${id}`),
  
  create: (name: string, quantity: number, storageAreaId: string) =>
    apiCall<PantryItem>('/items', {
      method: 'POST',
      body: JSON.stringify({ name, quantity, storageAreaId }),
    }),
  
  update: (id: string, updates: Partial<Omit<PantryItem, 'id'>>) =>
    apiCall<PantryItem>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    apiCall<void>(`/items/${id}`, {
      method: 'DELETE',
    }),
};

