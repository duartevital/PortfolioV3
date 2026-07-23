export const CATEGORIES = {
  'landscape-nature': 'Landscape / Nature',
  'street-urban': 'Street / Urban',
} as const;

export type CategorySlug = keyof typeof CATEGORIES;
