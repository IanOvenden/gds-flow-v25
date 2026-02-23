import { useEffect, useState } from 'react';

/**
 * Returns the PCore Redux store if available.
 */
export function getPCoreStore(): any | undefined {
  // @ts-ignore
  if (typeof PCore === 'undefined' || !PCore.getStore) return undefined;
  // @ts-ignore
  return PCore.getStore();
}

/**
 * React hook to select data from the PCore Redux store.
 */
export function usePegaSelector<T>(selector: (s: any) => T, initial: T): T {
  const [val, setVal] = useState<T>(() => {
    const s = getPCoreStore()?.getState?.();
    return s ? selector(s) : initial;
  });

  useEffect(() => {
    const store = getPCoreStore();
    if (!store?.subscribe || !store?.getState) return;

    const compute = () => setVal(selector(store.getState()));
    compute();

    const unsub = store.subscribe(compute);
    return () => unsub?.();
  }, [selector]);

  return val;
}
