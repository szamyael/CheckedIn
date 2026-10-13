"use client";

import { useEffect, useState } from "react";
import { BootstrapAdminForm } from "./BootstrapAdminForm";

export function BootstrapGate() {
  const [state, setState] = useState<
    "checking" | "required" | "configure-secret" | "complete" | "failed"
  >("checking");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/bootstrap")
      .then(async (res) => {
        if (!res.ok) throw new Error("Bootstrap status request failed");
        const data = await res.json();
        if (!active) return;
        setState(
          data.needsBootstrap
            ? "required"
            : data.bootstrapSetupRequired
              ? "configure-secret"
              : "complete",
        );
      })
      .catch(() => {
        if (active) setState("failed");
      });

    return () => {
      active = false;
    };
  }, []);

  if (state === "required") return <BootstrapAdminForm />;
  if (state === "configure-secret") {
    return (
      <p role="alert" className="mt-6 text-sm text-amber-900">
        First-admin setup is disabled. Configure a strong
        INITIAL_ADMIN_BOOTSTRAP_SECRET on the web server before continuing.
      </p>
    );
  }
  if (state === "failed") {
    return (
      <p role="alert" className="mt-6 text-sm text-red-700">
        Could not verify first-admin setup status. Try again later.
      </p>
    );
  }

  return null;
}
