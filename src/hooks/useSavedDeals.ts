import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  EMPTY_SAVED_SNAPSHOT,
  MAX_SAVED_DEALS,
  getSavedDealsSnapshot,
  toggleSavedDeal,
  subscribeSavedDeals,
} from '@/lib/savedDeals';

export function useSavedDeals() {
  const snapshot = useSyncExternalStore(
    subscribeSavedDeals,
    getSavedDealsSnapshot,
    () => EMPTY_SAVED_SNAPSHOT
  );
  const savedList = snapshot.keys;
  const savedSet = useMemo(() => new Set(savedList), [savedList]);
  const toggle = useCallback((slug: string) => toggleSavedDeal(slug), []);
  const isSaved = useCallback((slug: string) => savedSet.has(slug), [savedSet]);
  return {
    savedList,
    savedSet,
    toggle,
    isSaved,
    degraded: snapshot.degraded,
    atLimit: savedList.length >= MAX_SAVED_DEALS,
  };
}
