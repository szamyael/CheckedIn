"use client";

import { useEffect, useState } from "react";
import { BootstrapAdminForm } from "./BootstrapAdminForm";

export function BootstrapGate() {
  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/bootstrap")
      .then((res) => res.json())
      .then((data) => setNeedsBootstrap(Boolean(data.needsBootstrap)))
      .catch(() => setNeedsBootstrap(false));
  }, []);

  if (needsBootstrap === null) return null;
  if (!needsBootstrap) return null;

  return <BootstrapAdminForm />;
}
