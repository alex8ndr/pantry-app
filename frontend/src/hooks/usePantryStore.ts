import { useState, useCallback, useEffect, useRef } from 'react';
import type { StorageArea, StorageAreaId, PantryItem, AreaColor, AreaIcon } from '../domain/types';
import { DEFAULT_STORAGE_AREAS } from '../domain/types';
import { db, isIndexedDBAvailable } from '../db/index';

interface PantryStore {
  // State
  storageAreas: StorageArea[];
  items: PantryItem[];
  isLoading: boolean;
  
  // Computed
  getItemsForArea: (storageAreaId: StorageAreaId) => PantryItem[];
  getItemCountForArea: (storageAreaId: StorageAreaId) => number;
  
  // Storage area actions
  addStorageArea: (name: string, icon: AreaIcon, color: AreaColor) => void;
  updateStorageArea: (id: StorageAreaId, updates: Partial<Omit<StorageArea, 'id'>>) => void;
  deleteStorageArea: (id: StorageAreaId) => void;
  reorderStorageAreas: (ids: StorageAreaId[]) => void;
  
  // Item actions
  addItem: (name: string, quantity: number, storageAreaId: StorageAreaId, expiryDate?: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  openItem: (id: string, quantityToOpen: number) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function usePantryStore(): PantryStore {
  const [storageAreas, setStorageAreas] = useState<StorageArea[]>([]);
  const [items, setItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Load persisted state from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    const loadPersistedState = async () => {
      // Skip if IndexedDB is not available (e.g., in test environments with jsdom)
      if (!isIndexedDBAvailable()) {
        if (mounted) {
          setStorageAreas(DEFAULT_STORAGE_AREAS);
          setItems([]);
          setIsLoading(false);
          hasLoadedRef.current = true;
        }
        return;
      }

      try {
        const [areas, persistedItems] = await Promise.all([
          db.storageAreas.toArray(),
          db.items.toArray(),
        ]);

        if (!mounted) return;

        // If we have persisted areas, use them (sorted by order); otherwise initialize with defaults and persist them
        if (areas && areas.length > 0) {
          const sortedAreas = areas.sort((a, b) => a.order - b.order);
          setStorageAreas(sortedAreas);
        } else {
          try {
            await db.storageAreas.bulkPut(DEFAULT_STORAGE_AREAS);
            setStorageAreas(DEFAULT_STORAGE_AREAS);
          } catch (persistErr) {
            console.warn('Failed to persist default storage areas:', persistErr);
            setStorageAreas(DEFAULT_STORAGE_AREAS);
          }
        }

        // If we have persisted items, use them
        if (persistedItems && persistedItems.length > 0) {
          setItems(persistedItems);
        }

        setIsLoading(false);
        hasLoadedRef.current = true;
      } catch (err) {
        // If DB fails, fall back to defaults
        if (mounted) {
          console.warn('Failed to load persisted pantry state, using defaults:', err);
          setStorageAreas(DEFAULT_STORAGE_AREAS);
          setItems([]);
          setIsLoading(false);
          hasLoadedRef.current = true;
        }
      }
    };

    loadPersistedState();

    return () => {
      mounted = false;
    };
  }, []);

  // Persist storageAreas whenever they change (skip during initial load)
  useEffect(() => {
    if (!isIndexedDBAvailable() || !hasLoadedRef.current) return;

    const persistAreas = async () => {
      try {
        await db.transaction('rw', db.storageAreas, async () => {
          await db.storageAreas.clear();
          if (storageAreas.length > 0) {
            await db.storageAreas.bulkAdd(storageAreas);
          }
        });
      } catch (err) {
        console.warn('Failed to persist storage areas:', err);
      }
    };

    persistAreas();
  }, [storageAreas]);

  // Persist items whenever they change (skip during initial load)
  useEffect(() => {
    if (!isIndexedDBAvailable() || !hasLoadedRef.current) return;

    const persistItems = async () => {
      try {
        await db.transaction('rw', db.items, async () => {
          await db.items.clear();
          if (items.length > 0) {
            await db.items.bulkAdd(items);
          }
        });
      } catch (err) {
        console.warn('Failed to persist items:', err);
      }
    };

    persistItems();
  }, [items]);

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

    setStorageAreas((prev) => {
      const newArea: StorageArea = {
        id: generateId(),
        name: trimmedName,
        icon,
        color,
        order: prev.length,
      };
      return [...prev, newArea];
    });
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
    setStorageAreas((prev) => {
      const filtered = prev.filter((area) => area.id !== id);
      // Update order values to fill gaps after deletion
      return filtered.map((area, idx) => ({ ...area, order: idx }));
    });
    setItems((prev) => prev.filter((item) => item.storageAreaId !== id));
  }, []);

  const reorderStorageAreas = useCallback((ids: StorageAreaId[]) => {
    setStorageAreas((prev) => {
      const areaMap = new Map(prev.map((area) => [area.id, area]));
      const reordered = ids
        .map((id) => areaMap.get(id))
        .filter((area): area is StorageArea => area !== undefined)
        .map((area, idx) => ({ ...area, order: idx }));
      return reordered;
    });
  }, []);

  const addItem = useCallback(
    (name: string, quantity: number, storageAreaId: StorageAreaId, expiryDate?: string) => {
      const trimmedName = name.trim();
      if (!trimmedName || quantity < 1) return;

      setItems((prev) => {
        // Merge with existing item if same name, same area, same opened status, AND same expiry date
        const existingIndex = prev.findIndex(
          (item) =>
            item.storageAreaId === storageAreaId &&
            item.name.toLowerCase() === trimmedName.toLowerCase() &&
            item.isOpened === false && // Only merge with unopened items
            item.expiryDate === expiryDate // Must have same expiry date
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
          isOpened: false,
          expiryDate,
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

  const openItem = useCallback((id: string, quantityToOpen: number) => {
    setItems((prev) => {
      const itemIndex = prev.findIndex((item) => item.id === id);
      if (itemIndex === -1) return prev;

      const item = prev[itemIndex];
      
      // Calculate new expiry date (halve the days remaining, minimum 1 day)
      let newExpiryDate = item.expiryDate;
      if (item.expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 1) {
          const newDaysLeft = Math.max(1, Math.floor(daysLeft / 2));
          const newExpiryTime = today.getTime() + (newDaysLeft * 24 * 60 * 60 * 1000);
          newExpiryDate = new Date(newExpiryTime).toISOString().split('T')[0];
        }
      }
      
      // If opening all items, just mark the existing item as opened
      if (quantityToOpen >= item.quantity) {
        return prev.map((itm) =>
          itm.id === id
            ? { ...itm, isOpened: true, openedAt: Date.now(), expiryDate: newExpiryDate }
            : itm
        );
      }

      // Split the item: reduce quantity of unopened, create new opened item
      const updated = [...prev];
      updated[itemIndex] = {
        ...item,
        quantity: item.quantity - quantityToOpen,
      };

      // Add new opened item with adjusted expiry date
      const openedItem: PantryItem = {
        id: generateId(),
        name: item.name,
        quantity: quantityToOpen,
        storageAreaId: item.storageAreaId,
        createdAt: item.createdAt,
        isOpened: true,
        openedAt: Date.now(),
        expiryDate: newExpiryDate,
      };

      return [...updated, openedItem];
    });
  }, []);

  return {
    storageAreas,
    items,
    isLoading,
    getItemsForArea,
    getItemCountForArea,
    addStorageArea,
    updateStorageArea,
    deleteStorageArea,
    reorderStorageAreas,
    addItem,
    updateItemQuantity,
    removeItem,
    openItem,
  };
}
