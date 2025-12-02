export type StorageAreaId = string;

export type AreaColor = 
  | 'slate'
  | 'blue' 
  | 'cyan' 
  | 'emerald' 
  | 'amber' 
  | 'violet' 
  | 'rose';

export const AREA_COLORS: AreaColor[] = [
  'slate', 'blue', 'cyan', 'emerald', 'amber', 'violet', 'rose'
];

export type AreaIcon = 
  | 'refrigerator'
  | 'snowflake'
  | 'warehouse'
  | 'box'
  | 'home'
  | 'archive'
  | 'package';

export const AREA_ICONS: AreaIcon[] = [
  'refrigerator', 'snowflake', 'warehouse', 'box', 'home', 'archive', 'package'
];

export interface StorageArea {
  id: StorageAreaId;
  name: string;
  icon: AreaIcon;
  color: AreaColor;
  order: number;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  storageAreaId: StorageAreaId;
  createdAt: number;
  isOpened: boolean;
  openedAt?: number; // Timestamp when item was opened/started
  expiryDate?: string; // ISO date string (YYYY-MM-DD) - items with different expiry dates won't merge
}

export const DEFAULT_STORAGE_AREAS: StorageArea[] = [
  { id: 'fridge', name: 'Fridge', icon: 'refrigerator', color: 'cyan', order: 0 },
  { id: 'freezer', name: 'Freezer', icon: 'snowflake', color: 'blue', order: 1 },
  { id: 'pantry', name: 'Pantry', icon: 'warehouse', color: 'amber', order: 2 },
];
