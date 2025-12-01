import { useState, useCallback, useEffect } from 'react';
import type { StorageArea, StorageAreaId, PantryItem, AreaColor, AreaIcon } from '../domain/types';
import { storageAreaApi, itemApi } from '../services/api';

interface PantryStore {
  // State
  storageAreas: StorageArea[];
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;
  
  // Computed
  getItemsForArea: (storageAreaId: StorageAreaId) => PantryItem[];
  getItemCountForArea: (storageAreaId: StorageAreaId) => number;
  
  // Storage area actions
  addStorageArea: (name: string, icon: AreaIcon, color: AreaColor) => Promise<void>;
  updateStorageArea: (id: StorageAreaId, updates: Partial<Omit<StorageArea, 'id'>>) => Promise<void>;
  deleteStorageArea: (id: StorageAreaId) => Promise<void>;
  
  // Item actions
  addItem: (name: string, quantity: number, storageAreaId: StorageAreaId) => Promise<void>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

export function usePantryStore(): PantryStore {
  const [storageAreas, setStorageAreas] = useState<StorageArea[]>([]);
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [areasData, itemsData] = await Promise.all([
          storageAreaApi.getAll(),
          itemApi.getAll(),
        ]);
        setStorageAreas(areasData);
        setItems(itemsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getItemsForArea = useCallback(
    (storageAreaId: StorageAreaId): PantryItem[] => {
      return items
        .filter((item) => item.storageAreaId === storageAreaId)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    [items]
  );

  const getItemCountForArea = useCallback(
    (storageAreaId: StorageAreaId): number => {
      return items
        .filter((item) => item.storageAreaId === storageAreaId)
        .reduce((sum, item) => sum + item.quantity, 0);
    },
    [items]
  );

  const addStorageArea = useCallback(async (name: string, icon: AreaIcon, color: AreaColor) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const newArea = await storageAreaApi.create(trimmedName, icon, color);
      setStorageAreas((prev) => [...prev, newArea]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add storage area');
      console.error('Error adding storage area:', err);
    }
  }, []);

  const updateStorageArea = useCallback(
    async (id: StorageAreaId, updates: Partial<Omit<StorageArea, 'id'>>) => {
      try {
        const updated = await storageAreaApi.update(id, updates);
        setStorageAreas((prev) =>
          prev.map((area) => (area.id === id ? updated : area))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update storage area');
        console.error('Error updating storage area:', err);
      }
    },
    []
  );

  const deleteStorageArea = useCallback(async (id: StorageAreaId) => {
    try {
      await storageAreaApi.delete(id);
      setStorageAreas((prev) => prev.filter((area) => area.id !== id));
      setItems((prev) => prev.filter((item) => item.storageAreaId !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete storage area');
      console.error('Error deleting storage area:', err);
    }
  }, []);

  const addItem = useCallback(
    async (name: string, quantity: number, storageAreaId: StorageAreaId) => {
      const trimmedName = name.trim();
      if (!trimmedName || quantity < 1) return;

      try {
        const newItem = await itemApi.create(trimmedName, quantity, storageAreaId);
        setItems((prev) => {
          // Check if the item was merged with an existing one
          const existingIndex = prev.findIndex(
            (item) =>
              item.storageAreaId === storageAreaId &&
              item.name.toLowerCase() === trimmedName.toLowerCase()
          );

          if (existingIndex >= 0) {
            // Update existing item
            const updated = [...prev];
            updated[existingIndex] = newItem;
            return updated;
          }

          // Add new item
          return [...prev, newItem];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add item');
        console.error('Error adding item:', err);
      }
    },
    []
  );

  const updateItemQuantity = useCallback(async (id: string, quantity: number) => {
    try {
      if (quantity < 1) {
        await itemApi.delete(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        const updated = await itemApi.update(id, { quantity });
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      console.error('Error updating item:', err);
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    try {
      await itemApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      console.error('Error removing item:', err);
    }
  }, []);

  return {
    storageAreas,
    items,
    isLoading,
    error,
    getItemsForArea,
    getItemCountForArea,
    addStorageArea,
    updateStorageArea,
    deleteStorageArea,
    addItem,
    updateItemQuantity,
    removeItem,
  };
}
