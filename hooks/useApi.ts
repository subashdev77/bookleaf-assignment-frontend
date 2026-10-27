"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api";

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const depsKey = JSON.stringify(deps);
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(async (background = false) => {
    const id = ++requestId.current;
    if (!background) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      if (id === requestId.current) setState({ data, error: null, loading: false });
    } catch (err) {
      if (id === requestId.current) setState((s) => ({ ...s, error: errorMessage(err), loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, depsKey]);

  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  return {
    ...state,
    reload: (background = true) => load(background),
    setData,
  };
}
