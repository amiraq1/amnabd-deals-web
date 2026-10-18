import { useCallback, useEffect, useState } from 'react';
import {
  ResourceError,
  startRequest,
  type ResourceData,
  type ResourceErrorKind,
} from '@/lib/resource';

export function useResource<T>(loader: (signal: AbortSignal) => Promise<ResourceData<T>>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'error';
    data: ResourceData<T> | null;
    error: ResourceErrorKind | null;
  }>({ status: 'loading', data: null, error: null });
  const retry = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    const request = startRequest(loader);
    request.promise
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const kind = error instanceof ResourceError ? error.kind : 'network';
        if (kind !== 'cancelled')
          setState((previous) => ({ ...previous, status: 'error', error: kind }));
      });
    return () => {
      active = false;
      request.cancel();
    };
  }, [loader, version]);
  return { ...state, retry };
}
