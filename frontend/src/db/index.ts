import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { StorageArea, PantryItem } from '../domain/types';

/**
 * Check if IndexedDB is available in the current environment
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return !!window.indexedDB;
  } catch {
    return false;
  }
}

/**
 * PantryDB: IndexedDB wrapper for pantry app persistence
 * Stores storage areas and pantry items with indexed queries
 */
export class PantryDB extends Dexie {
  storageAreas!: Table<StorageArea, string>;
  items!: Table<PantryItem, string>;

  constructor() {
    super('pantry_app');
    
    // Version 1: Initial schema
    this.version(1).stores({
      storageAreas: 'id',
      items: 'id, storageAreaId, [storageAreaId+name], createdAt'
    });

    // Version 2: Add order index to storageAreas for consistent ordering
    this.version(2).stores({
      storageAreas: 'id, order',
      items: 'id, storageAreaId, [storageAreaId+name], createdAt'
    }).upgrade(tx => {
      // Migrate existing storage areas to have an order field
      return tx.table('storageAreas').toCollection().modify((area, ref) => {
        if (typeof area.order !== 'number') {
          ref.value = { ...area, order: 0 };
        }
      });
    });
  }
}

/**
 * Singleton instance of PantryDB
 */
export const db = new PantryDB();

/**
 * Utility function to clear all data from the database
 */
export async function clearDatabase(): Promise<void> {
  try {
    await db.transaction('rw', db.storageAreas, db.items, async () => {
      await db.storageAreas.clear();
      await db.items.clear();
    });
  } catch (err) {
    console.error('Failed to clear database:', err);
    throw err;
  }
}

/**
 * Utility function to export all data as JSON
 */
export async function exportDatabase(): Promise<{ storageAreas: StorageArea[]; items: PantryItem[] }> {
  try {
    const [storageAreas, items] = await Promise.all([
      db.storageAreas.toArray(),
      db.items.toArray(),
    ]);
    return { storageAreas, items };
  } catch (err) {
    console.error('Failed to export database:', err);
    throw err;
  }
}

/**
 * Utility function to import data from JSON
 */
export async function importDatabase(data: { storageAreas: StorageArea[]; items: PantryItem[] }): Promise<void> {
  try {
    await db.transaction('rw', db.storageAreas, db.items, async () => {
      await db.storageAreas.clear();
      await db.items.clear();
      if (data.storageAreas?.length) {
        await db.storageAreas.bulkAdd(data.storageAreas);
      }
      if (data.items?.length) {
        await db.items.bulkAdd(data.items);
      }
    });
  } catch (err) {
    console.error('Failed to import database:', err);
    throw err;
  }
}
