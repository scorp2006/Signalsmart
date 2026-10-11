import { Category } from './types';

export const colors = {
  bg: '#0E1726',
  surface: '#17233A',
  surfaceAlt: '#1F2E4A',
  border: '#2A3A5C',
  text: '#F2F5FA',
  textMuted: '#9FB0CC',
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
};

// Category -> map/legend colour.
export const categoryColor: Record<Category, string> = {
  Good: '#22C55E',
  Moderate: '#A3E635',
  Weak: '#F59E0B',
  Blackspot: '#EF4444',
  Unknown: '#6B7280',
};

export const categoryLabel: Record<Category, string> = {
  Good: 'Good',
  Moderate: 'Moderate',
  Weak: 'Weak',
  Blackspot: 'Blackspot',
  Unknown: 'Unknown (no data)',
};

export const spacing = (n: number) => n * 8;
