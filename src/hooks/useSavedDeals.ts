import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSavedDeals, toggleSavedDeal, subscribeSavedDeals } from '@/lib/savedDeals';

export function useSavedDeals() {
  const [savedList, setSavedList] = useState<string[]>(() => getSavedDeals());

  useEffect(() => {
    return subscribeSavedDeals(() => {
      setSavedList(getSavedDeals());
    });
  }, []);

  const savedSet = useMemo(() => new Set(savedList), [savedList]);

  const toggle = useCallback((slug: string) => {
    return toggleSavedDeal(slug);
  }, []);

  const isSaved = useCallback(
    (slug: string) => {
      return savedSet.has(slug);
    },
    [savedSet]
  );

  return { savedList, savedSet, toggle, isSaved };
}
