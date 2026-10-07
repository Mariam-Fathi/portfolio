import { useEffect, useState, type RefObject } from "react";

/**
 * Measures the width of the PORTFOL(I/O) element.
 * Returns a non-zero fallback immediately so downstream hooks
 * (useMariamSvg, etc.) never stall waiting for a measurement.
 *
 * Separated from animation hooks to break the circular dependency:
 *   portfolWidth → useMariamSvg → useDotAnimation
 */
export function usePortfolWidth(
  headerRef: RefObject<HTMLDivElement | null>,
): number {
  // Start with a non-zero fallback so the Mariam SVG renders immediately.
  // useMariamSvg will re-layout once the real measurement arrives.
  const [portfolWidth, setPortfolWidth] = useState<number>(() => {
    if (typeof window !== "undefined") return window.innerWidth * 0.75;
    return 800;
  });

  useEffect(() => {
    if (!headerRef.current) return;

    const measure = () => {
      const el =
        (headerRef.current?.querySelector(".hero-cover-title-portfoli") as HTMLElement | null) ??
        (headerRef.current?.querySelector(".hero-cover-title-whole") as HTMLElement | null);
      if (!el) return;

      // Temporarily force display so getBoundingClientRect is accurate
      // even when the element is visually hidden (e.g. opacity 0, clip-path).
      const orig = el.style.display;
      el.style.display = "inline";
      const w = el.getBoundingClientRect().width;
      el.style.display = orig;

      if (w > 0) setPortfolWidth(w);
    };

    measure();
    // Second pass after fonts/layout settle
    const t = setTimeout(measure, 120);
    return () => clearTimeout(t);
  }, [headerRef]);

  return portfolWidth;
}
