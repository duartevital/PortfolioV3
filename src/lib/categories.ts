export const GENRES = {
  travel: {
    label: 'Travel',
    description: 'Vital Photography — a travel photography portfolio spanning landscapes, nature, and street scenes.',
    categories: {
      'landscape-nature': 'Landscape / Nature',
      'street-urban': 'Street / Urban',
    },
  },
  dogs: {
    label: 'Dogs',
    description: 'Vital Photography — a dog photography portfolio: portraits and action shots.',
    categories: {
      'dog-portraits': 'Portraits',
      'dog-action': 'Action',
    },
  },
  weddings: {
    label: 'Weddings',
    description: 'Vital Photography — a wedding photography portfolio: ceremonies, receptions, and details.',
    categories: {
      'wedding-ceremony': 'Ceremony',
      'wedding-reception': 'Reception',
      'wedding-details': 'Details',
    },
  },
} as const;

export type GenreSlug = keyof typeof GENRES;
export const GENRE_SLUGS = Object.keys(GENRES) as GenreSlug[];

export const CATEGORIES = Object.fromEntries(
  Object.values(GENRES).flatMap((genre) => Object.entries(genre.categories))
) as Record<string, string>;

export type CategorySlug = { [K in GenreSlug]: keyof (typeof GENRES)[K]['categories'] }[GenreSlug];

const CATEGORY_TO_GENRE = Object.fromEntries(
  GENRE_SLUGS.flatMap((genre) => Object.keys(GENRES[genre].categories).map((category) => [category, genre]))
) as Record<CategorySlug, GenreSlug>;

export function genreOf(category: CategorySlug): GenreSlug {
  return CATEGORY_TO_GENRE[category];
}
