export type StorageAreaId = string;

export type AreaIcon = 'refrigerator' | 'snowflake' | 'warehouse';

export type AreaColor = 'blue' | 'cyan' | 'orange' | 'green' | 'purple' | 'red';

export interface StorageArea {
  id: StorageAreaId;
  name: string;
  icon: AreaIcon;
  color: AreaColor;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  storageAreaId: StorageAreaId;
  createdAt: number;
}

