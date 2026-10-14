"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLoader } from "@/components/LoaderProvider";

export function NavigationLoader() {
  const pathname = usePathname();
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as Element | null)?.closest("a");
      const href = link?.getAttribute("href");
      if (
        href?.startsWith("/") &&
        !href.startsWith("//") &&
        href !== pathname &&
        link?.target !== "_blank" &&
        !link?.hasAttribute("download")
      ) {
        showLoader("Opening page…");
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, showLoader]);

  useEffect(() => {
    hideLoader();
  }, [pathname, hideLoader]);

  return null;
}
