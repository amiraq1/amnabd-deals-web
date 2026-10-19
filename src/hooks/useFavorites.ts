import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  getFavoritesSnapshot,
  isSlugFavorite,
  subscribeFavorites,
  toggleFavoriteSlug,
} from '@/lib/favorites';

const SERVER_SNAPSHOT: readonly string[] = Object.freeze([]);

export interface UseFavoritesReturn {
  favorites: string[];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  count: number;
}

export function useFavorites(): UseFavoritesReturn {
  const snapshot = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => SERVER_SNAPSHOT
  );

  const favorites = useMemo(() => [...snapshot], [snapshot]);
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const toggleFavorite = useCallback((slug: string) => {
    toggleFavoriteSlug(slug);
  }, []);

  const isFavorite = useCallback(
    (slug: string) => {
      if (!slug) return false;
      return favoriteSet.has(slug) || isSlugFavorite(slug);
    },
    [favoriteSet]
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    count: favorites.length,
  };
}
