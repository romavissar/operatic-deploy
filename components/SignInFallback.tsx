"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

/** After 10s on factor-two, show a way to start over so user is not stuck on loading. */
export function SignInFallback() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const isFactorTwo = pathname?.includes("factor-two") ?? false;

  useEffect(() => {
    if (!isFactorTwo) return;
    const t = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(t);
  }, [isFactorTwo]);

  if (!show) return null;
  return (
    <p className="mt-6 text-center text-sm text-foreground/70">
      Stuck?{" "}
      <Link href="/sign-in?after_sign_in_url=%2F" className="underline underline-offset-2 hover:opacity-80">
        Start over
      </Link>
    </p>
  );
}
