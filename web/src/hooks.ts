import { useCallback, useEffect, useRef } from "react";

export function useAutoRefresh(
  fetcher: (isInitial: boolean) => Promise<void>,
  interval = 10000,
  deps: unknown[] = [],
): { refresh: () => void } {
  const fetcherRef = useRef(fetcher);
  const timerRef = useRef<number | undefined>(undefined);
  const mountedRef = useRef(true);
  const firstRef = useRef(true);

  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      await fetcherRef.current(firstRef.current);
      if (mountedRef.current) firstRef.current = false;
    } catch (e) {
      console.warn("auto refresh failed:", e);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    firstRef.current = true;

    const start = () => {
      refresh();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(refresh, interval);
    };

    const stop = () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mountedRef.current = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, ...deps]);

  return { refresh };
}
