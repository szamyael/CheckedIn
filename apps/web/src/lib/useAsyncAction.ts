"use client";

import { useLoader } from "@/components/LoaderProvider";

/** Wrap async UI actions with the global blocking loader. */
export function useAsyncAction() {
  const { withLoader } = useLoader();

  return async <T>(
    message: string,
    fn: () => Promise<T>,
  ): Promise<T> => withLoader(fn, message);
}
