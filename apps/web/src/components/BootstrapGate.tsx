"use client";

import { useEffect, useState } from "react";
import { BootstrapAdminForm } from "./BootstrapAdminForm";
import { UserErrorDialog } from "@/components/UserErrorDialog";

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
    return <UserErrorDialog message="First-admin setup isn't available. Contact your system administrator." />;
  }
  if (state === "failed") {
    return <UserErrorDialog message="We couldn't check first-admin setup. Try again later." />;
  }

  return null;
}
