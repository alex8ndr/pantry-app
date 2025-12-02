import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePantryStore } from './usePantryStore';
import { DEFAULT_STORAGE_AREAS } from '../domain/types';

describe('usePantryStore', () => {
  it('initializes with default storage areas', () => {
    const { result } = renderHook(() => usePantryStore());

    expect(result.current.storageAreas).toEqual(DEFAULT_STORAGE_AREAS);
    expect(result.current.items).toHaveLength(0);
  });

  it('adds a new storage area', () => {
    const { result } = renderHook(() => usePantryStore());

    act(() => {
      result.current.addStorageArea('Basement', 'box', 'violet');
    });

    const newArea = result.current.storageAreas.find((a) => a.name === 'Basement');
    expect(newArea).toBeDefined();
    expect(newArea?.icon).toBe('box');
    expect(newArea?.color).toBe('violet');
  });

  it('deletes a storage area and its items', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Milk', 2, areaId);
      result.current.deleteStorageArea(areaId);
    });

    expect(result.current.storageAreas.find((a) => a.id === areaId)).toBeUndefined();
    expect(result.current.items).toHaveLength(0);
  });

  it('adds an item to an area', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Milk', 2, areaId);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Milk');
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('merges duplicate items in the same area', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Milk', 2, areaId);
      result.current.addItem('milk', 3, areaId); // same item, different case
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('updates item quantity', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Eggs', 6, areaId);
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.updateItemQuantity(itemId, 12);
    });

    expect(result.current.items[0].quantity).toBe(12);
  });

  it('removes item when quantity reaches 0', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Juice', 2, areaId);
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.updateItemQuantity(itemId, 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('removes an item', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Apple', 3, areaId);
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.removeItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('filters items by area', () => {
    const { result } = renderHook(() => usePantryStore());
    const area1 = result.current.storageAreas[0].id;
    const area2 = result.current.storageAreas[1].id;

    act(() => {
      result.current.addItem('Milk', 1, area1);
      result.current.addItem('Ice Cream', 1, area2);
    });

    const area1Items = result.current.getItemsForArea(area1);
    expect(area1Items).toHaveLength(1);
    expect(area1Items[0].name).toBe('Milk');
  });

  it('reorders storage areas', () => {
    const { result } = renderHook(() => usePantryStore());

    const originalOrder = result.current.storageAreas.map((a) => a.id);
    const reversedOrder = [...originalOrder].reverse();

    act(() => {
      result.current.reorderStorageAreas(reversedOrder);
    });

    expect(result.current.storageAreas.map((a) => a.id)).toEqual(reversedOrder);
    // Verify order field is updated correctly
    result.current.storageAreas.forEach((area, idx) => {
      expect(area.order).toBe(idx);
    });
  });

  it('maintains order values after adding a new storage area', () => {
    const { result } = renderHook(() => usePantryStore());

    act(() => {
      result.current.addStorageArea('Basement', 'box', 'violet');
    });

    const basement = result.current.storageAreas.find((a) => a.name === 'Basement');
    expect(basement?.order).toBe(3); // Should be at the end
  });

  it('recomputes order values after deleting a storage area', () => {
    const { result } = renderHook(() => usePantryStore());

    act(() => {
      result.current.deleteStorageArea(result.current.storageAreas[0].id);
    });

    // Order should be recomputed to fill gaps
    result.current.storageAreas.forEach((area, idx) => {
      expect(area.order).toBe(idx);
    });
  });

  it('opens all items when quantity matches', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Milk', 2, areaId);
    });

    const itemId = result.current.items[0].id;
    
    // Item should start as unopened
    expect(result.current.items[0].isOpened).toBe(false);

    // Open all items (quantity = 2)
    act(() => {
      result.current.openItem(itemId, 2);
    });

    // Should still be 1 item, but now opened
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].isOpened).toBe(true);
    expect(result.current.items[0].openedAt).toBeDefined();
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('splits item when opening partial quantity', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    act(() => {
      result.current.addItem('Milk', 5, areaId);
    });

    const itemId = result.current.items[0].id;
    
    // Open only 2 out of 5
    act(() => {
      result.current.openItem(itemId, 2);
    });

    // Should now have 2 items
    expect(result.current.items).toHaveLength(2);
    
    const openedMilk = result.current.items.find(item => item.isOpened);
    const unopenedMilk = result.current.items.find(item => !item.isOpened);

    expect(openedMilk?.quantity).toBe(2);
    expect(openedMilk?.openedAt).toBeDefined();
    expect(unopenedMilk?.quantity).toBe(3);
    expect(unopenedMilk?.openedAt).toBeUndefined();
  });

  it('does not merge items with different opened states', () => {
    const { result } = renderHook(() => usePantryStore());
    const areaId = result.current.storageAreas[0].id;

    // Add unopened milk
    act(() => {
      result.current.addItem('Milk', 2, areaId);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);

    const firstMilkId = result.current.items[0].id;

    // Open it
    act(() => {
      result.current.openItem(firstMilkId, 2);
    });

    expect(result.current.items[0].isOpened).toBe(true);

    // Add more milk (unopened) - should NOT merge with opened milk
    act(() => {
      result.current.addItem('Milk', 3, areaId);
    });

    // Should now have 2 separate milk items
    expect(result.current.items).toHaveLength(2);
    
    const openedMilk = result.current.items.find(item => item.isOpened);
    const unopenedMilk = result.current.items.find(item => !item.isOpened);

    expect(openedMilk?.quantity).toBe(2);
    expect(unopenedMilk?.quantity).toBe(3);
  });
});
