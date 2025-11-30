import {
  Refrigerator,
  Snowflake,
  Warehouse,
  Box,
  Home,
  Archive,
  Package,
} from 'lucide-react';
import type { AreaIcon as AreaIconType } from '../domain/types';

interface AreaIconProps {
  icon: AreaIconType;
  size?: number;
  className?: string;
}

const iconMap = {
  refrigerator: Refrigerator,
  snowflake: Snowflake,
  warehouse: Warehouse,
  box: Box,
  home: Home,
  archive: Archive,
  package: Package,
} as const;

export function AreaIcon({ icon, size = 20, className }: AreaIconProps) {
  const IconComponent = iconMap[icon];
  return <IconComponent size={size} className={className} />;
}
