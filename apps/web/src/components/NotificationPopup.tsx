"use client";

import { X } from "lucide-react";
import Link from "next/link";

export interface NotificationPopupItem {
  id: string;
  title: string;
  body: string;
}

export function NotificationPopup({
  item,
  onDismiss,
  href,
}: {
  item: NotificationPopupItem | null;
  onDismiss: () => void;
  href?: string;
}) {
  if (!item) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] w-[min( calc(100vw-2rem),24rem)] rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-600">
            New notification
          </p>
          <p className="mt-1 text-sm font-semibold">{item.title}</p>
          {item.body && <p className="mt-1 text-xs text-slate-600">{item.body}</p>}
          {href && (
            <Link
              href={href}
              onClick={onDismiss}
              className="mt-3 inline-flex text-xs font-semibold text-teal-700 hover:underline"
            >
              View notification
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
