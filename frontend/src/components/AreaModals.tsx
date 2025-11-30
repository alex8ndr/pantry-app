import type { FormEvent } from 'react';
import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { StorageArea, AreaColor, AreaIcon as AreaIconType } from '../domain/types';
import { AREA_COLORS, AREA_ICONS } from '../domain/types';
import { AreaIcon } from './AreaIcon';

interface EditAreaModalProps {
  area: StorageArea;
  onSave: (updates: Partial<Omit<StorageArea, 'id'>>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditAreaModal({ area, onSave, onDelete, onClose }: EditAreaModalProps) {
  const [name, setName] = useState(area.name);
  const [icon, setIcon] = useState<AreaIconType>(area.icon);
  const [color, setColor] = useState<AreaColor>(area.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color });
    onClose();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Edit Storage Area</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="area-name">Name</label>
            <input
              id="area-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker">
              {AREA_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`icon-option ${icon === i ? 'selected' : ''}`}
                  onClick={() => setIcon(i)}
                  aria-label={i}
                  aria-pressed={icon === i}
                >
                  <AreaIcon icon={i} size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {AREA_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-option color-option--${c} ${color === c ? 'selected' : ''}`}
                  onClick={() => setColor(c)}
                  aria-label={c}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className={`delete-btn ${showDeleteConfirm ? 'confirm' : ''}`}
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
            </button>
            <div className="modal-actions-right">
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={!name.trim()}>
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddAreaModalProps {
  existingColors: AreaColor[];
  onAdd: (name: string, icon: AreaIconType, color: AreaColor) => void;
  onClose: () => void;
}

export function AddAreaModal({ existingColors, onAdd, onClose }: AddAreaModalProps) {
  const availableColor = AREA_COLORS.find((c) => !existingColors.includes(c)) ?? AREA_COLORS[0];
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<AreaIconType>('box');
  const [color, setColor] = useState<AreaColor>(availableColor);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), icon, color);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Add Storage Area</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="new-area-name">Name</label>
            <input
              id="new-area-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Garage Freezer"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker">
              {AREA_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`icon-option ${icon === i ? 'selected' : ''}`}
                  onClick={() => setIcon(i)}
                  aria-label={i}
                  aria-pressed={icon === i}
                >
                  <AreaIcon icon={i} size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {AREA_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-option color-option--${c} ${color === c ? 'selected' : ''}`}
                  onClick={() => setColor(c)}
                  aria-label={c}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <div />
            <div className="modal-actions-right">
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={!name.trim()}>
                Add Area
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
