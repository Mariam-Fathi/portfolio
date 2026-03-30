import { useEffect, useState, type RefObject } from "react";
import { FONTS } from "../constants";
import { checkIsMobile } from "./useIsMobile";
import type { MariamSvgData } from "../types";

// ── Module-level cache (survives unmount / remount) ─────────────────
// IMPORTANT – React 18 Strict Mode double-invokes effects in development.
// The first invocation may set svgDataCalculated = true, causing the second
// invocation to skip the layout calculation and use cached (possibly stale)
// data. This is expected in development only; production builds are unaffected.
let cachedSvgData: MariamSvgData | null = null;

// Bump this whenever the layout algorithm changes so stale caches are
// automatically discarded on the first load after a deploy.
const MARIAM_LAYOUT_VERSION = 12;

export function resetMariamCache() {
  cachedSvgData = null;
}

// ── Viewport height accounting for mobile browser chrome ────────────
function getViewportHeight(): number {
  if (
    checkIsMobile() &&
    typeof window !== "undefined" &&
    (window as any).visualViewport
  ) {
    return (window as any).visualViewport.height;
  }
  return window.innerHeight;
}

// ── Measure base text width ratio (cached — font is deterministic) ──
let cachedWidthPerFontSize: number | null = null;

function getWidthPerFontSize(): number {
  if (cachedWidthPerFontSize !== null) return cachedWidthPerFontSize;

  const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  tempSvg.style.cssText = "position:absolute;visibility:hidden;width:2000px;height:2000px";
  document.body.appendChild(tempSvg);

  const tempText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tempText.setAttribute("font-size", "200px");
  tempText.setAttribute("font-family", FONTS.display);
  tempText.setAttribute("font-weight", "700");
  tempText.setAttribute("letter-spacing", "0");
  tempText.textContent = "Mariam";
  tempSvg.appendChild(tempText);

  cachedWidthPerFontSize = tempText.getBBox().width / 200;
  document.body.removeChild(tempSvg);
  return cachedWidthPerFontSize;
}

// ── Bottom-align the text inside the SVG viewBox ────────────────────
function alignTextToBottom(
  textEl: SVGTextElement,
  mariamHeight: number,
  isMobile: boolean,
) {
  try {
    const bbox = textEl.getBBox();
    // Keep a small inset from the SVG bottom edge to avoid glyph antialias clipping.
    const bottomMargin = isMobile ? 6 : 8;
    const target = mariamHeight - bottomMargin;
    const yAdjustment = target - (bbox.y + bbox.height);
    textEl.setAttribute("y", yAdjustment.toString());
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[useMariamSvg] alignTextToBottom: getBBox failed — text may render at y=0. Cause:", err);
    }
  }
}

// ── Core layout calculation ─────────────────────────────────────────
// Extracted so it can be called from both the initial effect and the
// resize handler without duplicating logic.
//
// Key design decisions:
//   • Width ALWAYS fills the mariam slot column — font size is derived from width.
//   • Height is the actual rendered slot height so Mariam fills (not overflows) the cell.
//   • The SVG uses overflow:hidden so nothing bleeds past the frame.
//   • On return-to-hero the slot may not have its final size yet (grid re-paint);
//     we retry up to 12 rAF frames until the slot is large enough to trust.
function layoutMariam(
  svg: SVGSVGElement,
  portfolioHeaderRef: RefObject<HTMLDivElement | null>,
  isMobile: boolean,
  onDone?: () => void,
  attempt = 0,
) {
  // Locate the PORTFOL(I) / PORTFOLIO element used as the top anchor.
  const portfolEl =
    (portfolioHeaderRef.current?.querySelector(".hero-cover-title-portfoli") as HTMLElement | null) ??
    (portfolioHeaderRef.current?.querySelector(".hero-cover-title-whole") as HTMLElement | null);

  // Not painted yet — retry (can happen on return-to-hero mid paint cycle).
  if (!portfolEl) {
    if (attempt < 12) {
      requestAnimationFrame(() => layoutMariam(svg, portfolioHeaderRef, isMobile, onDone, attempt + 1));
    } else {
      onDone?.();
    }
    return;
  }

  const portfolRect = portfolEl.getBoundingClientRect();

  // Guard: element present but not yet laid out.
  if (portfolRect.width === 0 || portfolRect.height === 0) {
    if (attempt < 12) {
      requestAnimationFrame(() => layoutMariam(svg, portfolioHeaderRef, isMobile, onDone, attempt + 1));
    } else {
      onDone?.();
    }
    return;
  }

  const screenHeight = getViewportHeight();
  const screenWidth = window.innerWidth;

  const stripEl = document.querySelector("[data-hero-contact-strip]") as HTMLElement | null;
  const reserveBottom = stripEl?.dataset.noBottomReserve !== "true";
  const bottomReservePx =
    stripEl && reserveBottom ? Math.ceil(stripEl.getBoundingClientRect().height) : 0;

  const contactsNoBottomReserve = stripEl?.dataset.noBottomReserve === "true";
  const mariamSlotEl = svg.closest(".hero-mariam-slot") as HTMLElement | null;
  const mariamSlotRect = mariamSlotEl?.getBoundingClientRect();
  const mariamSlotWidth = mariamSlotRect?.width ?? 0;
  const mariamSlotHeight = mariamSlotRect?.height ?? 0;

  // ── Wait for the slot to have a real size before locking in layout ──
  // On first mount and on return-to-hero the grid may still be distributing
  // space. Retry up to 12 rAF frames (~200ms at 60fps) until the slot has a
  // width of at least 120px and height of at least 80px.
  if (!isMobile && (mariamSlotWidth < 120 || mariamSlotHeight < 80)) {
    if (attempt < 12) {
      requestAnimationFrame(() => layoutMariam(svg, portfolioHeaderRef, isMobile, onDone, attempt + 1));
      return;
    }
    // Gave up waiting — fall through with whatever values we have.
  }

  // ── Width ────────────────────────────────────────────────────────
  // Prefer the measured slot width; fall back to 75% of the grid width
  // (3fr out of a 1fr + 3fr grid) when the slot hasn't stretched yet.
  const gridEl = mariamSlotEl?.closest(".hero-inner-grid") as HTMLElement | null;
  const gridRect = gridEl?.getBoundingClientRect();
  const columnGap = gridEl ? parseFloat(getComputedStyle(gridEl).columnGap) || 0 : 0;
  const fallbackSlotWidth = gridRect
    ? Math.max(240, (gridRect.width - columnGap) * 0.75)
    : Math.max(240, screenWidth * 0.75);
  const resolvedSlotWidth = mariamSlotWidth > 10 ? mariamSlotWidth : fallbackSlotWidth;

  const rightPaddingPx =
    contactsNoBottomReserve && mariamSlotEl
      ? Math.ceil(parseFloat(getComputedStyle(mariamSlotEl).paddingRight || "0")) || 0
      : 0;

  const mariamWidth = Math.max(1, resolvedSlotWidth - rightPaddingPx);
  const sidebarOffsetPx = 0;

  // ── Height ───────────────────────────────────────────────────────
  // Use the slot's actual rendered height so Mariam fills exactly its
  // grid cell without bleeding past the frame bottom.
  const rawMobileH = Math.min(screenHeight * 0.3, 200);
  const availableHeight = isMobile
    ? Math.max(40, rawMobileH - bottomReservePx)
    : Math.max(40, screenHeight - portfolRect.bottom - bottomReservePx);

  const contactsHeight = stripEl ? stripEl.getBoundingClientRect().height : 0;
  const contactsHeightForCap =
    contactsNoBottomReserve && contactsHeight > 0
      ? Math.max(40, contactsHeight - 24)
      : contactsHeight;

  // Use full slot height — no arbitrary pixel cuts.
  const slotBasedHeight =
    mariamSlotHeight > 0
      ? Math.max(40, mariamSlotHeight)
      : availableHeight;

  const cappedAvailableHeight =
    contactsNoBottomReserve && contactsHeight > 0
      ? Math.max(40, Math.min(slotBasedHeight, contactsHeightForCap))
      : slotBasedHeight;

  const mariamHeight = Math.max(40, cappedAvailableHeight);
  const padding = 10;

  // ── Apply SVG container dimensions ───────────────────────────────
  svg.setAttribute("viewBox", `-${padding} 0 ${mariamWidth + padding * 2} ${mariamHeight}`);
  svg.setAttribute("width", `${mariamWidth}px`);
  svg.setAttribute("height", `${mariamHeight}px`);
  Object.assign(svg.style, {
    position: "relative",
    left: `${sidebarOffsetPx}px`,
    bottom: "0px",
    margin: "0",
    padding: "0",
    height: `${mariamHeight}px`,
    width: `${mariamWidth}px`,
    // overflow:hidden so Mariam never bleeds past the frame boundary.
    overflow: "hidden",
  });

  const textEl = svg.querySelector(".hero-mariam-text") as SVGTextElement | null;
  if (!textEl) { onDone?.(); return; }

  // Font size is derived from width — Mariam fills the column horizontally.
  const widthPerFontSize = getWidthPerFontSize();
  let fontSize = (mariamWidth - 2) / widthPerFontSize;

  textEl.setAttribute("x", "0");
  textEl.setAttribute("y", `${mariamHeight}px`);
  textEl.setAttribute("dominant-baseline", "baseline");
  textEl.setAttribute("text-anchor", "start");
  textEl.setAttribute("dx", "0");
  textEl.setAttribute("font-size", `${fontSize}px`);
  textEl.setAttribute("font-family", FONTS.display);
  textEl.setAttribute("font-weight", "700");
  textEl.setAttribute("letter-spacing", "0");

  // ── Measure → fine-tune scale → align → cache → done ─────────────
  // Three rAF passes ensure the browser has rendered the text at the
  // initial font size before we measure bbox and correct any drift.
  requestAnimationFrame(() => {
    alignTextToBottom(textEl, mariamHeight, isMobile);

    requestAnimationFrame(() => {
      try {
        const bbox = textEl.getBBox();

        // Fine-tune width scale only — height is already controlled by slot height.
        const widthScale = bbox.width > 0 ? (mariamWidth - 2) / bbox.width : 1;

        if (widthScale > 1.01 || widthScale < 0.99) {
          fontSize *= widthScale;
          textEl.setAttribute("font-size", `${fontSize}px`);
        }

        // Persist for same-session navigations and resize restores.
        cachedSvgData = {
          fontSize,
          mariamWidth,
          mariamHeight,
          sidebarOffsetPx,
          bottomReservePx,
          portfolBottom: portfolRect.bottom,
          portfolLeft: portfolRect.left,
          portfolFontSize: parseFloat(window.getComputedStyle(portfolEl).fontSize),
          screenWidth,
          screenHeight,
          layoutVersion: MARIAM_LAYOUT_VERSION,
        };
        requestAnimationFrame(() => {
          alignTextToBottom(textEl, mariamHeight, isMobile);
          // Extra rAF so isMariamReady fires after the browser has painted
          // the final SVG position — prevents dot landing in wrong spot.
          requestAnimationFrame(() => onDone?.());
        });
      } catch {
        onDone?.();
      }
    });
  });
}

// ── Hook ─────────────────────────────────────────────────────────────
export function useMariamSvg(
  svgRef: RefObject<SVGSVGElement | null>,
  portfolWidth: number,
  portfolioHeaderRef: RefObject<HTMLDivElement | null>,
  isActive: boolean,
): { isMariamReady: boolean } {
  const [isMariamReady, setIsMariamReady] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || portfolWidth === 0 || !portfolioHeaderRef.current) return;

    // Always reset ready so the caller knows a fresh layout is underway.
    setIsMariamReady(false);

    const isMobile = checkIsMobile();

    // ── Always do a fresh layout calculation on (re)mount ─────────
    // We previously tried to restore from a module-level cache using
    // getBoundingClientRect() comparisons. The problem: on return-to-hero
    // the hero grid CSS (height:0 → flex:1) needs several paint cycles to
    // settle. During that window the slot rects are wrong (0 height or
    // mismatched), so the cache check either:
    //   (a) passes the slot-size guard (curSlotHeight <= 0 → "valid") and
    //       calls applyCachedLayout with stale screen coords → Mariam wrong
    //       size/position, or
    //   (b) fails the check, discards the cache, calls layoutMariam too early
    //       → slot still not settled → wrong layout again.
    //
    // Fix: always discard any stale screen-coord cache on (re)mount and run
    // a fresh layoutMariam. layoutMariam itself retries up to 12 rAF frames
    // until the slot has a real size, so it handles "grid not settled yet"
    // correctly. The module-level cache is updated by layoutMariam and is
    // still used by the resize handler (no change there).
    cachedSvgData = null;

    const run = () => {
      layoutMariam(svg, portfolioHeaderRef, isMobile, () => {
        setIsMariamReady(true);
      });
    };

    // 100 ms gives the browser two full paint cycles (~32 ms for double-rAF)
    // plus extra budget for CSS transitions on the hero grid content frame
    // (it animates from height:0 → flex:1 when the hero becomes active).
    // Without this, the slot rect reads as 0 on return-to-hero.
    const mountTimer = setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(run));
    }, 100);

    // ── Resize handler ───────────────────────────────────────────
    // IMPORTANT: always read svgRef.current inside the callback, NOT the
    // `svg` variable captured at effect-setup time. When the user resizes
    // mobile → desktop (or back), React swaps which SVG is rendered
    // (hidden 1×1 mobile stub ↔ visible mariam-slot SVG), so svgRef.current
    // changes after this effect registered. Using the stale `svg` closure
    // means layoutMariam works on the wrong element (e.g. the invisible
    // 1×1 stub) and Mariam comes out tiny or invisible.
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentSvg = svgRef.current;
        if (!currentSvg) return;

        const mobile = checkIsMobile();

        // Skip tiny viewport shifts on mobile (virtual keyboard, URL bar, etc.).
        if (mobile && cachedSvgData) {
          const w = window.innerWidth;
          const h = getViewportHeight();
          if (
            Math.abs(w - cachedSvgData.screenWidth) < 100 &&
            Math.abs(h - cachedSvgData.screenHeight) < 100
          ) {
            return;
          }
        }

        cachedSvgData = null;
        layoutMariam(currentSvg, portfolioHeaderRef, mobile);
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(mountTimer);
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [portfolWidth, isActive, svgRef, portfolioHeaderRef]);

  return { isMariamReady };
}
