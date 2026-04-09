"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type LessonsFlashToastProps = {
  message: string | null;
  type: "success" | "error" | null;
};

export function LessonsFlashToast({ message, type }: LessonsFlashToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!message || !type) return;

    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("flash");
    next.delete("flashType");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [message, type, pathname, router, searchParams]);

  return null;
}

