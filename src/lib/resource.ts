export type ResourceErrorKind = 'configuration' | 'network' | 'invalid' | 'timeout' | 'cancelled';
export class ResourceError extends Error {
  constructor(public readonly kind: ResourceErrorKind) {
    super(`resource_${kind}`); // Never include upstream messages or response data.
    this.name = 'ResourceError';
  }
}
export interface ResourceData<T> {
  value: T;
  omitted: number;
}

// Promise.race bounds the wait even if an adapter fails to honor AbortSignal.
// The losing promise is still observed by race, so late failures are consumed.
export function startRequest<T>(loader: (signal: AbortSignal) => Promise<T>, timeoutMs = 10000) {
  const controller = new AbortController();
  let rejectAbort: (reason: ResourceError) => void = () => undefined;
  const aborted = new Promise<T>((_resolve, reject) => {
    rejectAbort = reject;
  });
  const timer = setTimeout(() => {
    rejectAbort(new ResourceError('timeout'));
    controller.abort();
  }, timeoutMs);
  const request = Promise.resolve().then(() => {
    if (controller.signal.aborted) throw new ResourceError('cancelled');
    return loader(controller.signal);
  });
  return {
    promise: Promise.race([request, aborted]).finally(() => clearTimeout(timer)),
    cancel: () => {
      rejectAbort(new ResourceError('cancelled'));
      controller.abort();
    },
  };
}
