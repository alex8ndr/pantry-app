import { useState } from 'react';
import { Plus } from 'lucide-react';
import './App.css';
import { StorageAreaCard, EditAreaModal, AddAreaModal } from './components';
import { usePantryStore } from './hooks/usePantryStore';
import type { StorageAreaId } from './domain/types';

function App() {
  const store = usePantryStore();
  const [editingAreaId, setEditingAreaId] = useState<StorageAreaId | null>(null);
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [collapsedAreas, setCollapsedAreas] = useState<Set<StorageAreaId>>(new Set());

  const editingArea = editingAreaId
    ? store.storageAreas.find((a) => a.id === editingAreaId)
    : null;

  const toggleCollapsed = (areaId: StorageAreaId) => {
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  // Show loading state
  if (store.isLoading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Pantry App</h1>
        </header>
        <main className="app-main">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (store.error) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Pantry App</h1>
        </header>
        <main className="app-main">
          <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
            <p>Error: {store.error}</p>
            <p>Make sure the backend server is running on http://localhost:3000</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pantry App</h1>
      </header>

      <main className="app-main">
        <div className="areas-grid">
          {store.storageAreas.map((area) => (
            <StorageAreaCard
              key={area.id}
              area={area}
              items={store.getItemsForArea(area.id)}
              isCollapsed={collapsedAreas.has(area.id)}
              onToggleCollapse={() => toggleCollapsed(area.id)}
              onAddItem={(name, qty) => store.addItem(name, qty, area.id)}
              onUpdateQuantity={store.updateItemQuantity}
              onRemoveItem={store.removeItem}
              onEditArea={() => setEditingAreaId(area.id)}
            />
          ))}

          <button
            type="button"
            className="add-area-card"
            onClick={() => setIsAddingArea(true)}
          >
            <Plus size={24} />
            <span>Add Area</span>
          </button>
        </div>
      </main>

      {editingArea && (
        <EditAreaModal
          area={editingArea}
          onSave={(updates) => store.updateStorageArea(editingArea.id, updates)}
          onDelete={() => store.deleteStorageArea(editingArea.id)}
          onClose={() => setEditingAreaId(null)}
        />
      )}

      {isAddingArea && (
        <AddAreaModal
          existingColors={store.storageAreas.map((a) => a.color)}
          onAdd={store.addStorageArea}
          onClose={() => setIsAddingArea(false)}
        />
      )}
    </div>
  );
}

export default App;
