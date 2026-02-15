"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type NavItem = { href: string; label: string };

interface MobileNavProps {
  nav: NavItem[];
  userIsAdmin?: boolean;
  children?: React.ReactNode;
}


export function MobileNav({ nav, userIsAdmin = false, children }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      setOpen(false);
      setClosing(false);
      setSlideIn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only close when route changes
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open && !closing) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideIn(true));
      });
      return () => cancelAnimationFrame(t);
    }
    if (!open) {
      setSlideIn(false);
    }
  }, [open, closing]);

  const close = () => {
    if (!open) return;
    setClosing(true);
    setSlideIn(false);
  };

  const handlePanelTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== panelRef.current || e.propertyName !== "transform") return;
    if (closing) {
      setOpen(false);
      setClosing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 p-1 text-foreground hover:opacity-70"
        aria-label="Open menu"
      >
        <span className="block w-5 h-px bg-current" />
        <span className="block w-5 h-px bg-current" />
        <span className="block w-5 h-px bg-current" />
      </button>

      {open && (
        <>
          <div
            className={`md:hidden fixed inset-0 z-40 bg-foreground/20 transition-opacity duration-200 ease-out ${closing ? "opacity-0" : "opacity-100"}`}
            aria-hidden
            onClick={close}
          />
          <aside
            ref={panelRef}
            onTransitionEnd={handlePanelTransitionEnd}
            className={`md:hidden fixed top-0 right-0 z-50 h-full w-[min(280px,85vw)] bg-background border-l border-border shadow-lg flex flex-col transition-transform duration-200 ease-out ${slideIn ? "translate-x-0" : "translate-x-full"}`}
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between px-4 py-5 border-b border-border">
              <span className="text-lg font-light text-foreground">Menu</span>
              <button
                type="button"
                onClick={close}
                className="flex items-center justify-center w-8 h-8 text-foreground/80 hover:text-foreground"
                aria-label="Close menu"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {nav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={href === "/" || href === "/about" || href === "/posts" ? false : undefined}
                  onClick={close}
                  className="py-3 px-3 text-foreground/80 font-light text-sm hover:text-foreground hover:bg-foreground/5 rounded-lg"
                >
                  {label}
                </Link>
              ))}
              {userIsAdmin && (
                <Link
                  href="/admin"
                  onClick={close}
                  className="py-3 px-3 text-foreground/80 font-light text-sm hover:text-foreground hover:bg-foreground/5 rounded-lg"
                >
                  Admin
                </Link>
              )}
              {children && (
                <div className="mt-2 pt-2 border-t border-border">
                  {children}
                </div>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
