import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { DatabaseService } from './database.js';
import type { StorageArea, PantryItem, AreaIcon, AreaColor } from './types.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = new DatabaseService();

// Helper to generate IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Error handling middleware
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============== Storage Area Routes ==============

// GET /api/storage-areas - Get all storage areas
app.get('/api/storage-areas', asyncHandler(async (req: Request, res: Response) => {
  const areas = db.getAllStorageAreas();
  res.json(areas);
}));

// GET /api/storage-areas/:id - Get a specific storage area
app.get('/api/storage-areas/:id', asyncHandler(async (req: Request, res: Response) => {
  const area = db.getStorageArea(req.params.id);
  if (!area) {
    return res.status(404).json({ error: 'Storage area not found' });
  }
  res.json(area);
}));

// POST /api/storage-areas - Create a new storage area
app.post('/api/storage-areas', asyncHandler(async (req: Request, res: Response) => {
  const { name, icon, color } = req.body;
  
  if (!name || !icon || !color) {
    return res.status(400).json({ error: 'Name, icon, and color are required' });
  }

  const newArea: StorageArea = {
    id: generateId(),
    name: name.trim(),
    icon: icon as AreaIcon,
    color: color as AreaColor
  };

  const created = db.createStorageArea(newArea);
  res.status(201).json(created);
}));

// PUT /api/storage-areas/:id - Update a storage area
app.put('/api/storage-areas/:id', asyncHandler(async (req: Request, res: Response) => {
  const { name, icon, color } = req.body;
  
  const updates: Partial<Omit<StorageArea, 'id'>> = {};
  if (name !== undefined) updates.name = name.trim();
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;

  const updated = db.updateStorageArea(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Storage area not found' });
  }
  
  res.json(updated);
}));

// DELETE /api/storage-areas/:id - Delete a storage area
app.delete('/api/storage-areas/:id', asyncHandler(async (req: Request, res: Response) => {
  const deleted = db.deleteStorageArea(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Storage area not found' });
  }
  res.status(204).send();
}));

// ============== Item Routes ==============

// GET /api/items - Get all items (optionally filtered by storage area)
app.get('/api/items', asyncHandler(async (req: Request, res: Response) => {
  const { storageAreaId } = req.query;
  
  const items = storageAreaId 
    ? db.getItemsByStorageArea(storageAreaId as string)
    : db.getAllItems();
  
  res.json(items);
}));

// GET /api/items/:id - Get a specific item
app.get('/api/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const item = db.getItem(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
}));

// POST /api/items - Create a new item
app.post('/api/items', asyncHandler(async (req: Request, res: Response) => {
  const { name, quantity, storageAreaId } = req.body;
  
  if (!name || !quantity || !storageAreaId) {
    return res.status(400).json({ error: 'Name, quantity, and storageAreaId are required' });
  }

  // Check if storage area exists
  const storageArea = db.getStorageArea(storageAreaId);
  if (!storageArea) {
    return res.status(400).json({ error: 'Invalid storageAreaId' });
  }

  // Check if item with same name already exists in this storage area
  const existingItems = db.getItemsByStorageArea(storageAreaId);
  const existingItem = existingItems.find(
    item => item.name.toLowerCase() === name.trim().toLowerCase()
  );

  if (existingItem) {
    // Update the existing item's quantity
    const updated = db.updateItem(existingItem.id, {
      quantity: existingItem.quantity + quantity
    });
    return res.json(updated);
  }

  const newItem: PantryItem = {
    id: generateId(),
    name: name.trim(),
    quantity: quantity,
    storageAreaId,
    createdAt: Date.now()
  };

  const created = db.createItem(newItem);
  res.status(201).json(created);
}));

// PUT /api/items/:id - Update an item
app.put('/api/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const { name, quantity, storageAreaId } = req.body;
  
  const updates: Partial<Omit<PantryItem, 'id'>> = {};
  if (name !== undefined) updates.name = name.trim();
  if (quantity !== undefined) updates.quantity = quantity;
  if (storageAreaId !== undefined) updates.storageAreaId = storageAreaId;

  const updated = db.updateItem(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  res.json(updated);
}));

// DELETE /api/items/:id - Delete an item
app.delete('/api/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const deleted = db.deleteItem(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.status(204).send();
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

