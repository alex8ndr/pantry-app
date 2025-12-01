import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePantryStore } from './usePantryStore';
import { DEFAULT_STORAGE_AREAS } from '../domain/types';
import type { StorageArea, PantryItem } from '../domain/types';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  storageAreaApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  itemApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usePantryStore', () => {
  let mockStorageAreas: StorageArea[];
  let mockItems: PantryItem[];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock data
    mockStorageAreas = [...DEFAULT_STORAGE_AREAS];
    mockItems = [];
    
    // Mock API responses
    vi.mocked(api.storageAreaApi.getAll).mockResolvedValue(mockStorageAreas);
    vi.mocked(api.itemApi.getAll).mockResolvedValue(mockItems);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default storage areas', async () => {
    const { result } = renderHook(() => usePantryStore());

    // Wait for initial data fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.storageAreas).toEqual(DEFAULT_STORAGE_AREAS);
    expect(result.current.items).toHaveLength(0);
  });

  it('adds a new storage area', async () => {
    const newArea: StorageArea = {
      id: 'basement-123',
      name: 'Basement',
      icon: 'box',
      color: 'violet',
    };
    vi.mocked(api.storageAreaApi.create).mockResolvedValue(newArea);

    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addStorageArea('Basement', 'box', 'violet');
    });

    const addedArea = result.current.storageAreas.find((a) => a.name === 'Basement');
    expect(addedArea).toBeDefined();
    expect(addedArea?.icon).toBe('box');
    expect(addedArea?.color).toBe('violet');
  });

  it('deletes a storage area and its items', async () => {
    const testItem: PantryItem = {
      id: 'item-123',
      name: 'Milk',
      quantity: 2,
      storageAreaId: 'fridge',
      createdAt: Date.now(),
    };
    
    vi.mocked(api.itemApi.create).mockResolvedValue(testItem);
    vi.mocked(api.storageAreaApi.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const areaId = result.current.storageAreas[0].id;

    await act(async () => {
      await result.current.addItem('Milk', 2, areaId);
    });

    await act(async () => {
      await result.current.deleteStorageArea(areaId);
    });

    expect(result.current.storageAreas.find((a) => a.id === areaId)).toBeUndefined();
    expect(result.current.items.filter((item) => item.storageAreaId === areaId)).toHaveLength(0);
  });

  it('adds an item to an area', async () => {
    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const areaId = result.current.storageAreas[0].id;
    const testItem: PantryItem = {
      id: 'item-123',
      name: 'Milk',
      quantity: 2,
      storageAreaId: areaId,
      createdAt: Date.now(),
    };

    vi.mocked(api.itemApi.create).mockResolvedValue(testItem);

    await act(async () => {
      await result.current.addItem('Milk', 2, areaId);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Milk');
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('merges duplicate items in the same area', async () => {
    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const areaId = result.current.storageAreas[0].id;
    
    const firstItem: PantryItem = {
      id: 'item-123',
      name: 'Milk',
      quantity: 2,
      storageAreaId: areaId,
      createdAt: Date.now(),
    };

    const mergedItem: PantryItem = {
      id: 'item-123',
      name: 'Milk',
      quantity: 5,
      storageAreaId: areaId,
      createdAt: Date.now(),
    };

    vi.mocked(api.itemApi.create).mockResolvedValueOnce(firstItem).mockResolvedValueOnce(mergedItem);

    await act(async () => {
      await result.current.addItem('Milk', 2, areaId);
    });

    await act(async () => {
      await result.current.addItem('milk', 3, areaId); // same item, different case
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('updates item quantity', async () => {
    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const areaId = result.current.storageAreas[0].id;
    
    const testItem: PantryItem = {
      id: 'item-123',
      name: 'Eggs',
      quantity: 6,
      storageAreaId: areaId,
      createdAt: Date.now(),
    };

    const updatedItem: PantryItem = {
      ...testItem,
      quantity: 12,
    };

    vi.mocked(api.itemApi.create).mockResolvedValue(testItem);
    vi.mocked(api.itemApi.update).mockResolvedValue(updatedItem);

    await act(async () => {
      await result.current.addItem('Eggs', 6, areaId);
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.updateItemQuantity(itemId, 12);
    });

    expect(result.current.items[0].quantity).toBe(12);
  });

  it('removes item when quantity reaches 0', async () => {
    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const areaId = result.current.storageAreas[0].id;
    
    const testItem: PantryItem = {
      id: 'item-123',
      name: 'Juice',
      quantity: 2,
      storageAreaId: areaId,
      createdAt: Date.now(),
    };

    vi.mocked(api.itemApi.create).mockResolvedValue(testItem);
    vi.mocked(api.itemApi.delete).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.addItem('Juice', 2, areaId);
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.updateItemQuantity(itemId, 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('removes an item', async () => {
    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const areaId = result.current.storageAreas[0].id;
    
    const testItem: PantryItem = {
      id: 'item-123',
      name: 'Apple',
      quantity: 3,
      storageAreaId: areaId,
      createdAt: Date.now(),
    };

    vi.mocked(api.itemApi.create).mockResolvedValue(testItem);
    vi.mocked(api.itemApi.delete).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.addItem('Apple', 3, areaId);
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.removeItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('filters items by area', async () => {
    const { result } = renderHook(() => usePantryStore());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const area1 = result.current.storageAreas[0].id;
    const area2 = result.current.storageAreas[1].id;

    const item1: PantryItem = {
      id: 'item-1',
      name: 'Milk',
      quantity: 1,
      storageAreaId: area1,
      createdAt: Date.now(),
    };

    const item2: PantryItem = {
      id: 'item-2',
      name: 'Ice Cream',
      quantity: 1,
      storageAreaId: area2,
      createdAt: Date.now(),
    };

    vi.mocked(api.itemApi.create).mockResolvedValueOnce(item1).mockResolvedValueOnce(item2);

    await act(async () => {
      await result.current.addItem('Milk', 1, area1);
      await result.current.addItem('Ice Cream', 1, area2);
    });

    const area1Items = result.current.getItemsForArea(area1);
    expect(area1Items).toHaveLength(1);
    expect(area1Items[0].name).toBe('Milk');
  });
});
