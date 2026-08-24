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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{copy.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{copy.body}</p>
      <p className="mt-3 text-xs text-slate-500">{copy.settingsHint}</p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void allowAccess()}
          className="rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white"
        >
          Allow access
        </button>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
