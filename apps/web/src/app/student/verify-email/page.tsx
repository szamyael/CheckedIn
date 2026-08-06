"use client";

import { Suspense } from "react";
import VerifyEmailInner from "./VerifyEmailInner";

export default function StudentVerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
