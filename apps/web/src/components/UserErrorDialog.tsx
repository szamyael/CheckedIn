"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const DEFAULT_MESSAGE = "Please try again. If the problem continues, contact support.";
const subscribeToNothing = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

function simplifyError(message: string) {
  const text = message.trim().replace(/^(?:[a-z]+error|authapierror|postgresterror):\s*/i, "");
  const normalized = text.toLowerCase();

  if (/invalid login credentials|invalid credentials|email or password/.test(normalized)) {
    return "The email or password doesn't match our records. Check it and try again.";
  }
  if (/duplicate key|already exists|already registered|already in use/.test(normalized)) {
    return "That information is already in use. Check your entry and try again.";
  }
  if (/email not confirmed|email not verified/.test(normalized)) {
    return "Please verify your email before signing in.";
  }
  if (/row-level security|permission denied|not authorized|unauthorized|forbidden/.test(normalized)) {
    return "You don't have permission to do that. Contact your administrator if you need access.";
  }
  if (/too many requests|rate limit|too many attempts/.test(normalized)) {
    return "There have been too many attempts. Wait a little, then try again.";
  }
  if (/invalid input syntax|violates check constraint|check constraint/.test(normalized)) {
    return "Some information is missing or in the wrong format. Check it and try again.";
  }
  if (/failed to fetch|network error|network request|timed? out|timeout|service unavailable/.test(normalized)) {
    return "We couldn't connect right now. Check your internet connection and try again.";
  }
  if (/supabase|postgres|postgrest|sqlstate|pgrst\d+|jwt|relation .* does not exist|stack trace/.test(normalized)) {
    return DEFAULT_MESSAGE;
  }

  return text && text.length <= 240 ? text : DEFAULT_MESSAGE;
}

export function UserErrorDialog({
  message,
  onClose,
  closeLabel = "Close",
}: {
  message: string | null | undefined;
  onClose?: () => void;
  closeLabel?: string;
}) {
  return <UserErrorDialogContent key={message ?? "empty"} message={message} onClose={onClose} closeLabel={closeLabel} />;
}

function UserErrorDialogContent({
  message,
  onClose,
  closeLabel,
}: {
  message: string | null | undefined;
  onClose?: () => void;
  closeLabel: string;
}) {
  const mounted = useSyncExternalStore(subscribeToNothing, getClientMounted, getServerMounted);
  const [dismissed, setDismissed] = useState(false);
  const close = () => {
    setDismissed(true);
    onClose?.();
  };

  useEffect(() => {
    if (!message) return;
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDismissed(true);
        onClose?.();
      }
    }
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [message, onClose]);

  if (!mounted || !message || dismissed) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="user-error-title"
        aria-describedby="user-error-message"
        className="w-full max-w-sm space-y-4 rounded-xl border border-red-200 bg-white p-5 text-slate-900 shadow-2xl"
      >
        <div>
          <h2 id="user-error-title" className="text-lg font-semibold">We couldn&apos;t complete that</h2>
          <p id="user-error-message" className="mt-2 text-sm leading-6 text-slate-700">{simplifyError(message)}</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={close}
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          >
            {closeLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}