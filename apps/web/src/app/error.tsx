"use client";

import { useEffect } from "react";
import { UserErrorDialog } from "@/components/UserErrorDialog";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CheckedIn route error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)] px-5 py-12 text-[var(--foreground)]">
      <UserErrorDialog
        message="We couldn't load this page. Your work is safe. Try again."
        onClose={reset}
        closeLabel="Try again"
      />
    </main>
  );
}
