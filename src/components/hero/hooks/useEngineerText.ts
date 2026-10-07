import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { checkIsMobile } from "./useIsMobile";
import { ENGINEER_TEXT } from "../constants";
import { hasDotAnimationEverCompleted } from "./useDotAnimation";

// ── Module-level cache (survives unmount / remount) ─────────────────
// IMPORTANT – React 18 Strict Mode double-invokes effects in development.
// The first invocation may set engineerTextEverShown = true, causing the
// second invocation to skip to the blur-in path instead of the write-on.
// This is expected in development only and does NOT happen in production.
let engineerTextEverShown = false;

// ── Cached width-per-font-size ratio (font is deterministic, measure once) ──
// Avoids two forced reflows per position() call by pre-computing how wide the
// text is at a reference size and scaling from that ratio.
let cachedWidthRatio: number | null = null;

function getWidthRatio(el: HTMLDivElement): number {
  if (cachedWidthRatio !== null) return cachedWidthRatio;
  const REF = 48;
  el.style.fontSize = `${REF}px`;
  const refWidth = el.getBoundingClientRect().width;
  cachedWidthRatio = refWidth > 0 ? refWidth / REF : null;
  return cachedWidthRatio ?? 1;
}

/**
 * Animates the "Software Engineer" text with a write-on (clip reveal) effect
 * and positions it dynamically above the "ıam" portion of "Mariam".
 * Reveal starts when the dot lands on "ı" (cause: the fall triggers the appearance).
 *
 * On mobile the final state is applied immediately — no animation.
 * On subsequent visits (cache hit), the final state is restored instantly.
 *
 * Positioning note: this hook owns ALL positional inline styles on the element
 * (top, left, bottom, right, fontSize). The portal in hero.tsx sets only
 * non-positional defaults (opacity, filter, zIndex) so there is no specificity
 * conflict — no !important needed.
 */
export function useEngineerText(
  engineerRef: RefObject<HTMLDivElement | null>,
  svgRef: RefObject<SVGSVGElement | null>,
  svgIRef: RefObject<SVGTSpanElement | null>,
  svgA2Ref: RefObject<SVGTSpanElement | null>,
  svgM2Ref: RefObject<SVGTSpanElement | null>,
  startEngineerReveal: boolean,
  isMariamReady: boolean,
  isMobileViewport: boolean,
  onEngineerRevealComplete?: () => void,
) {
  const revealStartedRef = useRef(false);

  // ── Always kill tweens on cleanup, regardless of which branch ran ──
  // Separate effect so the cleanup always registers even when the reveal
  // effect exits early (mobile path, cache-hit path, !startEngineerReveal).
  // Uses the class selector because React detaches the ref before unmount cleanup runs.
  useEffect(() => {
    return () => {
      gsap.killTweensOf(".hero-engineer-text");
    };
  }, []);

  // ── When reveal is not active, hide the text — but only if the text
  // was never fully shown yet. Once engineerTextEverShown is true we must
  // NOT hide it: on mobile→desktop resize, startEngineerReveal briefly
  // becomes false while isMariamReady resets during Mariam's re-layout,
  // which would wipe out the visible "Software Engineer" text. ──
  useEffect(() => {
    if (startEngineerReveal) return;
    if (engineerTextEverShown) return; // already revealed — keep it visible
    const el = engineerRef.current;
    if (el) {
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 0, filter: "blur(0px)", clipPath: "none" });
    }
  }, [startEngineerReveal, engineerRef]);

  // ── Ensure "Software Engineer" is visible whenever reveal is active ──
  // This re-runs on every isMariamReady cycle (not just when startEngineerReveal
  // first becomes true) so the text is guaranteed visible after any Mariam
  // re-layout (resize, return-to-hero, etc.). Without this, the element can
  // be left at opacity:0 after the position effect's cleanup/re-run cycle.
  useEffect(() => {
    if (!startEngineerReveal) return;
    const el = engineerRef.current;
    if (!el) return;
    if (isMobileViewport) return;
    // Immediate: ensure opacity 1
    requestAnimationFrame(() => {
      if (engineerRef.current) gsap.set(engineerRef.current, { opacity: 1, visibility: "visible" });
    });
    // Delayed: ensure clipPath none so text is fully visible after write-on (2s) or on mobile
    const isMobile = checkIsMobile();
    const delayMs = isMobile ? 50 : 2500;
    const t = setTimeout(() => {
      if (engineerRef.current) gsap.set(engineerRef.current, { clipPath: "none" });
    }, delayMs);
    return () => clearTimeout(t);
  }, [startEngineerReveal, isMariamReady, engineerRef, isMobileViewport]);

  // ── Hard restore after mobile → desktop remount ────────────────────
  // The engineer portal is conditionally unmounted on mobile in hero.tsx.
  // When it remounts on desktop, force the final visible state if reveal had
  // already happened (or dot cache says it did), regardless of effect timing.
  useEffect(() => {
    if (isMobileViewport) return;
    const el = engineerRef.current;
    if (!el) return;
    // Only force desktop restore after the reveal already happened.
    // Do NOT run this during first write-on, otherwise it cancels the typing effect.
    const shouldRestoreVisible =
      engineerTextEverShown || hasDotAnimationEverCompleted();
    if (!shouldRestoreVisible) return;

    if (!el.textContent?.trim()) el.textContent = "Software  Engineer";
    gsap.killTweensOf(el);
    gsap.set(el, {
      opacity: 1,
      visibility: "visible",
      filter: "blur(0px)",
      x: 0,
      y: 0,
      rotation: 0,
      clipPath: "none",
    });

    const applyDesktopPosition = () => {
      const currentEl = engineerRef.current;
      const currentI = svgIRef.current;
      const currentA2 = svgA2Ref.current;
      const currentM2 = svgM2Ref.current;
      if (!currentEl || !currentI || !currentA2 || !currentM2) return;

      const iRect = currentI.getBoundingClientRect();
      const m2Rect = currentM2.getBoundingClientRect();
      const iamWidth = m2Rect.right - iRect.left;
      const dotY = iRect.top + iRect.height * 0.19;
      if (iamWidth <= 0) return;

      const ratio = getWidthRatio(currentEl);
      const targetFontSize = (iamWidth / ratio) * 0.95;
      const minFontSize = 20;
      currentEl.style.fontSize = `${Math.max(minFontSize, targetFontSize)}px`;

      const engRect = currentEl.getBoundingClientRect();
      const descenderOffset = engRect.height * 0.4;
      const iamCenterX = iRect.left + iamWidth / 2;
      const engLeft = iamCenterX - engRect.width / 2;
      const top = dotY - engRect.height + descenderOffset + ENGINEER_TEXT.VERTICAL_NUDGE_PX;

      currentEl.style.top = `${top}px`;
      currentEl.style.bottom = "auto";
      currentEl.style.left = `${engLeft}px`;
      currentEl.style.right = "auto";
      if (shouldRestoreVisible) currentEl.style.clipPath = "none";
      currentEl.style.visibility = "visible";
      currentEl.style.opacity = "1";
    };

    // Re-apply position after desktop remount/resize. Multiple passes handle
    // post-resize SVG layout settling.
    applyDesktopPosition();
    requestAnimationFrame(applyDesktopPosition);
    const t = setTimeout(() => {
      requestAnimationFrame(applyDesktopPosition);
    }, 250);

    return () => clearTimeout(t);
  }, [isMobileViewport, isMariamReady, startEngineerReveal, engineerRef, svgIRef, svgA2Ref, svgM2Ref]);

  // ── Write-on reveal (starts when dot lands on "ı") ──────────────
  useEffect(() => {
    if (isMobileViewport) {
      const el = engineerRef.current;
      if (el) {
        gsap.killTweensOf(el);
        gsap.set(el, { opacity: 0, visibility: "hidden", clipPath: "none", filter: "blur(0px)" });
      }
      return;
    }

    if (!startEngineerReveal) return;
    const isMobile = checkIsMobile();

    // ── Mobile/sm: set final state immediately (do not set engineerTextEverShown so that
    //    if user resizes to lg and clicks the dot, they still get the write-on effect) ──
    if (isMobile) {
      if (engineerRef.current) {
        const el = engineerRef.current;
        if (!el.textContent?.trim()) el.textContent = "Software  Engineer";
        gsap.set(el, { opacity: 0, visibility: "hidden", filter: "blur(0px)", x: 0, y: 0, rotation: 0, clipPath: "none" });
      }
      // If dot flow already completed, treat engineer text as permanently revealed.
      if (hasDotAnimationEverCompleted()) {
        engineerTextEverShown = true;
      }
      onEngineerRevealComplete?.();
      return;
    }

    // ── Returning visit: fade in to match hero blur entrance ─────
    if (engineerTextEverShown) {
      const el = engineerRef.current;
      if (el) {
        el.textContent = "Software  Engineer";
        gsap.set(el, { opacity: 0, filter: "blur(15px)", x: 0, y: 0, rotation: 0, clipPath: "none" });
        gsap.to(el, {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power2.out",
          delay: 0.2,
          onComplete: () => onEngineerRevealComplete?.(),
        });
      }
      return;
    }

    // ── Desktop: write-on effect (first visit only) ──────────────
    const el = engineerRef.current;
    if (!el || !el.parentElement) return;

    gsap.killTweensOf(el);
    if (!el.textContent?.trim()) el.textContent = "Software  Engineer";

    // Start fully clipped (hidden) — reveal left-to-right, no delay (starts at dot touch)
    gsap.set(el, {
      opacity: 1,
      x: 0,
      y: 0,
      rotation: 0,
      filter: "blur(0px)",
      clipPath: "inset(-20% 100% -20% 0)",
    });

    revealStartedRef.current = true;
    gsap.to(el, {
      clipPath: "inset(-20% 0% -20% 0)",
      duration: 2,
      ease: "power1.inOut",
      delay: 0,
      onComplete: () => {
        gsap.set(el, { clipPath: "none" });
        engineerTextEverShown = true;
        onEngineerRevealComplete?.();
      },
    });
  // onEngineerRevealComplete is stable (useCallback [] deps in hero.tsx).
  // Listed here to satisfy exhaustive-deps without causing extra re-runs.
  }, [startEngineerReveal, engineerRef, onEngineerRevealComplete, isMariamReady, isMobileViewport]);

  // ── Position & scale relative to the "ıam" in Mariam ───────────
  // Runs only when Mariam is ready (not when reveal starts) so the text never
  // re-positions mid-reveal — avoids "starts writing then jumps".
  //
  // This hook owns the element's positional styles (top/left/bottom/right/
  // fontSize) via direct assignment. No !important is needed because the
  // portal in hero.tsx intentionally sets only non-positional defaults.
  useEffect(() => {
    if (!isMariamReady || isMobileViewport) return;
    const el = engineerRef.current;
    const a2 = svgA2Ref.current;
    const m2 = svgM2Ref.current;
    const svgEl = svgRef.current;
    if (!el || !a2 || !m2 || !svgEl) return;

    if (!el.textContent?.trim()) el.textContent = "Software  Engineer";

    const position = () => {
      const isMobile = checkIsMobile();
      const iEl = svgIRef.current;
      if (!iEl || !a2 || !m2 || !el) return;

      const iRect = iEl.getBoundingClientRect();
      const m2Rect = m2.getBoundingClientRect();
      const iamWidth = m2Rect.right - iRect.left;
      const dotY = iRect.top + iRect.height * 0.19;

      if (iamWidth <= 0) return;

      // Single reflow: use cached ratio to compute target fontSize, then set once.
      // getWidthRatio() measures at 48px the first time and caches the px-per-px ratio.
      const ratio = getWidthRatio(el);
      const targetFontSize = (iamWidth / ratio) * 0.95;
      const minFontSize = checkIsMobile() ? 14 : 20;
      el.style.fontSize = `${Math.max(minFontSize, targetFontSize)}px`;

      const engRect = el.getBoundingClientRect();
      const descenderOffset = engRect.height * 0.4;
      const iamCenterX = iRect.left + iamWidth / 2;
      const engLeft = iamCenterX - engRect.width / 2;

      // ENGINEER_TEXT.VERTICAL_NUDGE_PX compensates for the gap between the SVG
      // baseline and the actual rendered top of the descender-adjusted text block.
      const top = dotY - engRect.height + descenderOffset + ENGINEER_TEXT.VERTICAL_NUDGE_PX;

      el.style.top = `${top}px`;
      el.style.bottom = "auto";
      el.style.left = `${engLeft}px`;
      el.style.right = "auto";

      // Keep hidden until reveal starts (clip-path covers the text from the right).
      // Do not overwrite clipPath while desktop write-on is in progress.
      const writeOnInProgress = revealStartedRef.current && !engineerTextEverShown;
      if (!engineerTextEverShown && !isMobile && !writeOnInProgress) {
        gsap.set(el, { opacity: 1, clipPath: "inset(-20% 100% -20% 0)" });
      }
    };

    // Three staggered calls defend against SVG not being fully painted yet:
    // rAF fires before paint, 100ms catches post-font-load shifts, 300ms
    // catches any remaining async layout from useMariamSvg's rAF chain.
    // TODO: replace with a shared "mariamLayoutReady" signal from useMariamSvg
    // so this hook doesn't need to guess the right delay after resize.
    requestAnimationFrame(position);
    const t1 = setTimeout(position, 100);
    const t2 = setTimeout(position, 300);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeRaf: number | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (settleTimer) clearTimeout(settleTimer);
      // Keep it responsive while still letting Mariam settle.
      // We run one near-immediate pass, then a short debounced pass.
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        requestAnimationFrame(position);
      });
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        cachedWidthRatio = null; // invalidate — fontSize changes on resize
        requestAnimationFrame(() => requestAnimationFrame(position));
      }, 160);
      // Final late pass after SVG/text settle on larger breakpoint shifts.
      settleTimer = setTimeout(() => {
        cachedWidthRatio = null;
        requestAnimationFrame(() => requestAnimationFrame(position));
      }, 420);
    };
    window.addEventListener("resize", onResize);

    // React to real SVG layout/size changes, not just window resize events.
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          requestAnimationFrame(position);
        });
      });
      observer.observe(svgEl);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
        resizeTimer = null;
      }
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
      if (observer) observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [isMariamReady, startEngineerReveal, isMobileViewport, engineerRef, svgRef, svgIRef, svgA2Ref, svgM2Ref]);
}
