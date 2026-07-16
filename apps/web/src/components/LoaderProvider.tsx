"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LoaderContextValue = {
  visible: boolean;
  message: string;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  withLoader: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
};

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("Please wait…");

  const showLoader = useCallback((msg = "Please wait…") => {
    setMessage(msg);
    setVisible(true);
  }, []);

  const hideLoader = useCallback(() => {
    setVisible(false);
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
    () => ({ visible, message, showLoader, hideLoader, withLoader }),
    [visible, message, showLoader, hideLoader, withLoader],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {visible && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex min-w-[220px] flex-col items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 px-8 py-7 shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-teal-500/30 border-t-teal-400" />
            <p className="text-center text-sm font-medium text-slate-100">
              {message}
            </p>
            <p className="text-center text-xs text-slate-400">
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
