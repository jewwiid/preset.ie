// Shared types for marketplace components

export interface EquipmentType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  sort_order: number;
}

export interface EquipmentBrand {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
}

export interface PredefinedModel {
  id: string;
  equipment_type_id: string;
  brand: string;
  model: string;
  description: string;
  sort_order: number;
  equipment_types?: {
    name: string;
    display_name: string;
  };
}

export interface Purpose {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  sort_order: number;
}

export interface UserRating {
  average_rating: number;
  total_reviews: number;
}

export const CONDITIONS = [
  'any',
  'new',
  'like_new',
  'used',
  'fair'
] as const;

export type ConditionType = typeof CONDITIONS[number];

export const CONDITION_LABELS: Record<ConditionType, string> = {
  'any': 'Any Condition',
  'new': 'New',
  'like_new': 'Like New',
  'used': 'Used',
  'fair': 'Fair'
};
