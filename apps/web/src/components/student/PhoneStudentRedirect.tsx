"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isPhoneDevice() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const mobileUa =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      ua,
    );
  const narrow = window.matchMedia("(max-width: 768px)").matches;
  return mobileUa || narrow;
}

/** On phones, send visitors to the student (mobile-style) login. */
export function PhoneStudentRedirect({
  to = "/student/login",
}: {
  to?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (isPhoneDevice()) {
      router.replace(to);
    }
  }, [router, to]);

  return null;
}
