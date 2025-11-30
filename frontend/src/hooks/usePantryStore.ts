import { useState, useCallback } from 'react';
import type { StorageArea, StorageAreaId, PantryItem, AreaColor, AreaIcon } from '../domain/types';
import { DEFAULT_STORAGE_AREAS } from '../domain/types';

interface PantryStore {
  // State
  storageAreas: StorageArea[];
  items: PantryItem[];
  
  // Computed
  getItemsForArea: (storageAreaId: StorageAreaId) => PantryItem[];
  getItemCountForArea: (storageAreaId: StorageAreaId) => number;
  
  // Storage area actions
  addStorageArea: (name: string, icon: AreaIcon, color: AreaColor) => void;
  updateStorageArea: (id: StorageAreaId, updates: Partial<Omit<StorageArea, 'id'>>) => void;
  deleteStorageArea: (id: StorageAreaId) => void;
  
  // Item actions
  addItem: (name: string, quantity: number, storageAreaId: StorageAreaId) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function usePantryStore(): PantryStore {
  const [storageAreas, setStorageAreas] = useState<StorageArea[]>(DEFAULT_STORAGE_AREAS);
  const [items, setItems] = useState<PantryItem[]>([]);

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

  const addStorageArea = useCallback((name: string, icon: AreaIcon, color: AreaColor) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newArea: StorageArea = {
      id: generateId(),
      name: trimmedName,
      icon,
      color,
    };
    setStorageAreas((prev) => [...prev, newArea]);
  }, []);

  const updateStorageArea = useCallback(
    (id: StorageAreaId, updates: Partial<Omit<StorageArea, 'id'>>) => {
      setStorageAreas((prev) =>
        prev.map((area) =>
          area.id === id ? { ...area, ...updates } : area
        )
      );
    },
    []
  );

  const deleteStorageArea = useCallback((id: StorageAreaId) => {
    setStorageAreas((prev) => prev.filter((area) => area.id !== id));
    setItems((prev) => prev.filter((item) => item.storageAreaId !== id));
  }, []);

  const addItem = useCallback(
    (name: string, quantity: number, storageAreaId: StorageAreaId) => {
      const trimmedName = name.trim();
      if (!trimmedName || quantity < 1) return;

      setItems((prev) => {
        // Merge with existing item if same name in same area
        const existingIndex = prev.findIndex(
          (item) =>
            item.storageAreaId === storageAreaId &&
            item.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }

        return [...prev, {
          id: generateId(),
          name: trimmedName,
          quantity,
          storageAreaId,
          createdAt: Date.now(),
        }];
      });
    },
    []
  );

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    storageAreas,
    items,
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
