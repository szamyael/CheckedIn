"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandLogo";
import { StudentTermsBody } from "@/components/student/StudentTermsBody";
import { markStudentTermsAccepted } from "@/lib/student/terms";

export default function StudentTermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  function submit() {
    if (!accepted) return;
    markStudentTermsAccepted();
    router.replace("/student/login");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <BrandMark size={40} />
        <span className="text-xs text-slate-500">August 2026</span>
      </div>

      <StudentTermsBody className="flex-1 overflow-y-auto pr-1" />

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600"
          />
          <span>I have read and accept the Terms &amp; Privacy Notice</span>
        </label>
        <button
          type="button"
          disabled={!accepted}
          onClick={submit}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          I accept and continue
        </button>
      </div>
    </div>
  );
}
