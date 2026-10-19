import { useEffect, useState } from 'react';

export interface LookupState<T> {
  data: T[] | null;
  failed: boolean;
  retry: () => void;
}

export function useLookup<T>(active: boolean,
  fetchLookup: (signal: AbortSignal) => Promise<T[]>): LookupState<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!active || data !== null) return;
    const controller = new AbortController();
    fetchLookup(controller.signal).then((options) => {
      if (!controller.signal.aborted) setData(options);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [active, data, attempt, fetchLookup]);

  function retry() {
    setFailed(false);
    setAttempt((value) => value + 1);
  }

  return { data, failed, retry };
}
