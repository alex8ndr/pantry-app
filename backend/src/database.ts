import Database from 'better-sqlite3';
import type { StorageArea, PantryItem } from './types.js';

export class DatabaseService {
  private db: Database.Database;

  constructor(filename: string = 'pantry.db') {
    this.db = new Database(filename);
    this.initDatabase();
  }

  private initDatabase() {
    // Create storage areas table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS storage_areas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `);

    // Create items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        storage_area_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (storage_area_id) REFERENCES storage_areas(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_items_storage_area_id ON items(storage_area_id)
    `);

    // Add default storage areas if none exist
    const count = this.db.prepare('SELECT COUNT(*) as count FROM storage_areas').get() as { count: number };
    if (count.count === 0) {
      this.initDefaultStorageAreas();
    }
  }

  private initDefaultStorageAreas() {
    const defaultAreas = [
      { id: 'fridge', name: 'Fridge', icon: 'refrigerator', color: 'blue' },
      { id: 'freezer', name: 'Freezer', icon: 'snowflake', color: 'cyan' },
      { id: 'pantry', name: 'Pantry', icon: 'warehouse', color: 'orange' }
    ];

    const stmt = this.db.prepare('INSERT INTO storage_areas (id, name, icon, color) VALUES (?, ?, ?, ?)');
    
    for (const area of defaultAreas) {
      stmt.run(area.id, area.name, area.icon, area.color);
    }
  }

  // Storage Area operations
  getAllStorageAreas(): StorageArea[] {
    const stmt = this.db.prepare('SELECT * FROM storage_areas ORDER BY name');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color
    }));
  }

  getStorageArea(id: string): StorageArea | null {
    const stmt = this.db.prepare('SELECT * FROM storage_areas WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color
    };
  }

  createStorageArea(area: StorageArea): StorageArea {
    const stmt = this.db.prepare('INSERT INTO storage_areas (id, name, icon, color) VALUES (?, ?, ?, ?)');
    stmt.run(area.id, area.name, area.icon, area.color);
    return area;
  }

  updateStorageArea(id: string, updates: Partial<Omit<StorageArea, 'id'>>): StorageArea | null {
    const current = this.getStorageArea(id);
    if (!current) return null;

    const updated = { ...current, ...updates };
    const stmt = this.db.prepare('UPDATE storage_areas SET name = ?, icon = ?, color = ? WHERE id = ?');
    stmt.run(updated.name, updated.icon, updated.color, id);
    return updated;
  }

  deleteStorageArea(id: string): boolean {
    // First delete all items in this storage area
    const deleteItems = this.db.prepare('DELETE FROM items WHERE storage_area_id = ?');
    deleteItems.run(id);
    
    // Then delete the storage area
    const stmt = this.db.prepare('DELETE FROM storage_areas WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Item operations
  getAllItems(): PantryItem[] {
    const stmt = this.db.prepare('SELECT * FROM items ORDER BY name');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      storageAreaId: row.storage_area_id,
      createdAt: row.created_at
    }));
  }

  getItemsByStorageArea(storageAreaId: string): PantryItem[] {
    const stmt = this.db.prepare('SELECT * FROM items WHERE storage_area_id = ? ORDER BY name');
    const rows = stmt.all(storageAreaId) as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      storageAreaId: row.storage_area_id,
      createdAt: row.created_at
    }));
  }

  getItem(id: string): PantryItem | null {
    const stmt = this.db.prepare('SELECT * FROM items WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      storageAreaId: row.storage_area_id,
      createdAt: row.created_at
    };
  }

  createItem(item: PantryItem): PantryItem {
    const stmt = this.db.prepare(
      'INSERT INTO items (id, name, quantity, storage_area_id, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(item.id, item.name, item.quantity, item.storageAreaId, item.createdAt);
    return item;
  }

  updateItem(id: string, updates: Partial<Omit<PantryItem, 'id'>>): PantryItem | null {
    const current = this.getItem(id);
    if (!current) return null;

    const updated = { ...current, ...updates };
    const stmt = this.db.prepare(
      'UPDATE items SET name = ?, quantity = ?, storage_area_id = ?, created_at = ? WHERE id = ?'
    );
    stmt.run(updated.name, updated.quantity, updated.storageAreaId, updated.createdAt, id);
    return updated;
  }

  deleteItem(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  close() {
    this.db.close();
  }
}

