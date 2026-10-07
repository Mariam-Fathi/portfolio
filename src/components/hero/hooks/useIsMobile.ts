import { useState, useLayoutEffect } from "react";
import { BREAKPOINTS } from "../constants";

/**
 * Reactive hook — triggers re-render only when the breakpoint is crossed.
 * Uses `matchMedia` instead of a resize listener so the callback fires
 * once per threshold crossing, not on every pixel of resize.
 */
export function useIsMobile(breakpoint: number = BREAKPOINTS.md): boolean {
  // Start with the server value (false) so hydration matches, then sync to the
  // real viewport in a layout effect, which runs before the first paint.
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    // Sync in case the breakpoint prop changed between renders
    setIsMobile(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Non-reactive check — reads the current viewport width at call time.
 * Use inside callbacks / GSAP onComplete where you don't want a re-render.
 */
export function checkIsMobile(breakpoint: number = BREAKPOINTS.md): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= breakpoint;
}
