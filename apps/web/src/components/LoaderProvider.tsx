"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const LOADER_DELAY_MS = 500;

type LoaderContextValue = {
  visible: boolean;
  message: string;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  withLoader: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
};

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("Please wait…");
  const [visibleOperations, setVisibleOperations] = useState(0);
  const operations = useRef(new Map<number, { visible: boolean; timer: ReturnType<typeof setTimeout> }>());
  const nextOperationId = useRef(0);

  const showLoader = useCallback((msg = "Please wait…") => {
    const id = nextOperationId.current++;
    setMessage(msg);
    const timer = setTimeout(() => {
      const operation = operations.current.get(id);
      if (!operation) return;
      operation.visible = true;
      setVisibleOperations((count) => count + 1);
    }, LOADER_DELAY_MS);
    operations.current.set(id, { visible: false, timer });
  }, []);

  const hideLoader = useCallback(() => {
    const entry = operations.current.entries().next();
    if (entry.done) return;
    const [id, operation] = entry.value;
    clearTimeout(operation.timer);
    operations.current.delete(id);
    if (operation.visible) {
      setVisibleOperations((count) => Math.max(0, count - 1));
    }
  }, []);

  const withLoader = useCallback(
    async <T,>(fn: () => Promise<T>, msg = "Please wait…") => {
      showLoader(msg);
      try {
        return await fn();
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader],
  );

  const value = useMemo(
    () => ({
      visible: visibleOperations > 0,
      message,
      showLoader,
      hideLoader,
      withLoader,
    }),
    [visibleOperations, message, showLoader, hideLoader, withLoader],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {visibleOperations > 0 && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="relative flex min-w-[240px] flex-col items-center gap-4 overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-8 py-7 text-[var(--foreground)] shadow-[var(--shadow-lift)]">
            <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-[var(--primary-soft)]">
              <div className="h-full w-1/3 animate-[loader-sweep_1.1s_ease-in-out_infinite] bg-[var(--accent)]" />
            </div>
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-[var(--primary-soft)]">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)]" />
              <span className="absolute h-2 w-2 rounded-full bg-[var(--accent)]" />
            </div>
            <p className="text-center text-sm font-medium">
              {message}
            </p>
            <p className="text-center text-xs text-[var(--muted)]">
              Process is ongoing…
            </p>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) {
    throw new Error("useLoader must be used within LoaderProvider");
  }
  return ctx;
}
