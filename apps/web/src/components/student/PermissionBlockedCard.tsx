"use client";

import {
  ensureBrowserPermission,
  permissionCopy,
  type BrowserPermission,
} from "@/lib/student/browser-permissions";

export function PermissionBlockedCard({
  permission,
  onRetry,
}: {
  permission: BrowserPermission;
  onRetry?: () => void;
}) {
  const copy = permissionCopy(permission);

  async function allowAccess() {
    const granted = await ensureBrowserPermission(permission);
    if (granted) onRetry?.();
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center shadow-[var(--shadow-soft)]">
      <h2 className="text-base font-semibold text-[var(--primary-strong)]">{copy.title}</h2>
      <p className="mt-2 text-sm text-[var(--foreground)]">{copy.body}</p>
      <p className="mt-3 text-xs text-[var(--muted)]">{copy.settingsHint}</p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void allowAccess()}
          className="min-h-11 rounded-xl bg-[var(--action-background)] py-2.5 text-sm font-semibold text-[var(--action-foreground)]"
        >
          Allow access
        </button>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
