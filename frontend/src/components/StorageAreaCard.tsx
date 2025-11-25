import type { FormEvent } from 'react';
import { useState, useRef } from 'react';
import { Plus, Minus, X, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import type { StorageArea, PantryItem } from '../domain/types';
import { AreaIcon } from './AreaIcon';

// Threshold for showing collapse toggle on desktop (roughly how many items fit in collapsed view)
const COLLAPSE_THRESHOLD = 4;

interface StorageAreaCardProps {
  area: StorageArea;
  items: PantryItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddItem: (name: string, quantity: number) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onEditArea: () => void;
}

export function StorageAreaCard({
  area,
  items,
  isCollapsed,
  onToggleCollapse,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  onEditArea,
}: StorageAreaCardProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddItem(newItemName.trim(), newItemQty);
    setNewItemName('');
    setNewItemQty(1);
    inputRef.current?.focus();
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const showCollapseToggle = items.length > COLLAPSE_THRESHOLD;

  return (
    <section className={`area-card area-card--${area.color} ${isCollapsed ? 'area-card--collapsed' : ''}`}>
      {/* Header - clickable on mobile to toggle collapse */}
      <header 
        className="area-card-header"
        onClick={onToggleCollapse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleCollapse(); }}
        aria-expanded={!isCollapsed}
      >
        <div className="area-card-title">
          <AreaIcon icon={area.icon} size={18} />
          <h2>{area.name}</h2>
          <span className="area-card-count">{itemCount}</span>
        </div>
        {/* Mobile collapse indicator */}
        <span className="area-card-collapse-indicator">
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </span>
        <button
          type="button"
          className="area-card-settings"
          onClick={(e) => {
            e.stopPropagation();
            onEditArea();
          }}
          aria-label={`Edit ${area.name}`}
        >
          <Settings size={16} />
        </button>
      </header>

      <form 
        onSubmit={handleSubmit} 
        className="area-card-form"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add item..."
          aria-label={`Add item to ${area.name}`}
        />
        <div className="qty-input">
          <button
            type="button"
            onClick={() => setNewItemQty(Math.max(1, newItemQty - 1))}
            aria-label="Decrease quantity"
            tabIndex={-1}
          >
            <Minus size={14} />
          </button>
          <span>{newItemQty}</span>
          <button
            type="button"
            onClick={() => setNewItemQty(newItemQty + 1)}
            aria-label="Increase quantity"
            tabIndex={-1}
          >
            <Plus size={14} />
          </button>
        </div>
        <button type="submit" className="add-btn" disabled={!newItemName.trim()}>
          <Plus size={16} />
        </button>
      </form>

      <div className={`area-card-body ${isCollapsed ? 'area-card-body--collapsed' : ''}`}>
        {items.length === 0 ? (
          <p className="area-card-empty">No items yet</p>
        ) : (
          <ul className="area-card-items">
            {items.map((item) => (
              <li key={item.id} className="item-row">
                <span className="item-name">{item.name}</span>
                <div className="item-controls">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="item-qty">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    className="item-remove"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop-only toggle, only if enough items */}
      {showCollapseToggle && (
        <button
          type="button"
          className="area-card-collapse-toggle"
          onClick={onToggleCollapse}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? `Expand ${area.name}` : `Collapse ${area.name}`}
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      )}
    </section>
  );
}
