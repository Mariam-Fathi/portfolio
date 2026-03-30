import { useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { SKIP_PORTFOLIO_ANIMATION } from "../constants";
import type { PortfolioData, PortfolioCacheRef } from "../types";
import {
  portfolioCache,
  resetPortfolioCache as resetPortfolioCacheImpl,
  hasPortfolioEverCompleted as hasPortfolioEverCompletedImpl,
} from "../portfolioCache";

// Re-export so Hero can keep importing from this hook
export { resetPortfolioCacheImpl as resetPortfolioCache, hasPortfolioEverCompletedImpl as hasPortfolioEverCompleted };

// ── Helper: query header sub-elements ────────────────────────────────
function getHeaderElements(headerRef: RefObject<HTMLDivElement | null>) {
  const el = headerRef.current;
  if (!el) return null;
  const full = el.querySelector(".hero-cover-title-full") as HTMLElement | null;
  const portfoli = el.querySelector(".hero-cover-title-portfoli") as HTMLElement | null;
  const o = el.querySelector(".hero-cover-title-o") as HTMLElement | null;
  const line = el.querySelector(".hero-cover-title-line") as HTMLElement | null;
  if (!full || !portfoli || !o || !line) return null;
  return { full, portfoli, o, line };
}

// ── Restore the final state: fixed PORTFOLI + line from O + O (letter) at end ─
function restoreFinalState(
  headerRef: RefObject<HTMLDivElement | null>,
  data: PortfolioData,
) {
  const els = getHeaderElements(headerRef);
  if (!els) return;
  const { full, portfoli, o, line } = els;

  full.style.display = "none";
  portfoli.style.display = "inline";
  o.style.display = "inline";
  line.style.display = "block";

  gsap.set([portfoli, o], { display: "inline", opacity: 1, rotation: 0, x: 0 });
  Object.assign(line.style, {
    display: "block",
    opacity: "1",
    left: `${data.iOriginalPosition}px`,
    width: `${data.lineFinalWidth}px`,
  });
  gsap.set(line, { opacity: 1, width: data.lineFinalWidth });
}

// ── Restore to collapsed: PORTFOLI + O with O at start, line at 0 (e.g. after resize lg→md when not expanded) ─
function restoreCollapsedState(
  headerRef: RefObject<HTMLDivElement | null>,
  data: PortfolioData,
  oDragWrapperRef: RefObject<HTMLDivElement | null> | undefined,
  setIsComplete: (v: boolean) => void,
  onDragStart?: () => void,
  onUserExpandChange?: (expanded: boolean) => void,
) {
  const els = getHeaderElements(headerRef);
  if (!els) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[usePortfolioAnimation] restoreCollapsedState: header sub-elements not found — drag not attached. The portfolio header may not have rendered yet.");
    }
    return;
  }
  const { full, portfoli, o, line } = els;

  full.style.display = "none";
  portfoli.style.display = "inline";
  o.style.display = "inline";
  line.style.display = "block";

  const target = (oDragWrapperRef?.current ?? o) as HTMLElement;
  gsap.set([portfoli, o], { display: "inline", opacity: 1, rotation: 0, x: 0 });
  gsap.set(target, { x: 0 });
  Object.assign(line.style, {
    display: "block",
    opacity: "1",
    left: `${data.iOriginalPosition}px`,
    width: "0px",
  });
  gsap.set(line, { opacity: 1, width: 0 });

  setIsComplete(false);
  return attachODragAfterRestore(headerRef, oDragWrapperRef, data, setIsComplete, onDragStart, onUserExpandChange);
}

// ── Resize handler: reposition O and line when expanded so they stay in view (shared by desktop & mobile) ─
// Returns both the handler (to add/remove from the event) and a cancel function
// (to clear any pending debounce timeout on unmount, preventing stale callbacks
// from firing after the component has been torn down).
function createResizeHandler(
  headerRef: RefObject<HTMLDivElement | null>,
  oDragWrapperRef: RefObject<HTMLDivElement | null> | undefined,
  cache: PortfolioCacheRef,
): { handler: () => void; cancel: () => void } {
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const handler = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      if (!cache.everCompleted || !cache.cachedData) return;
      const els = getHeaderElements(headerRef);
      if (!els) return;
      const { o: oEl, line: lineEl } = els;

      const targetEl = (oDragWrapperRef?.current ?? oEl) as HTMLElement;
      const currentOGsapX = Number(gsap.getProperty(targetEl, "x")) || 0;
      const threshold = cache.cachedData.oFinalX * 0.6;
      const isCurrentlyExpanded = currentOGsapX >= threshold;
      if (!isCurrentlyExpanded) return;

      const cRect = headerRef.current?.getBoundingClientRect();
      if (!cRect) return;

      const padding = window.innerWidth < 768 ? 16 : 32;
      const viewportRight = window.innerWidth - padding;
      const absoluteEnd = Math.min(cRect.width - padding, viewportRight - cRect.left);

      const oWidth = oEl.getBoundingClientRect().width;
      const oFinalLeft = Math.min(absoluteEnd - oWidth / 2, viewportRight - cRect.left - oWidth / 2);

      const targetRect = targetEl.getBoundingClientRect();
      const currentOLeft = targetRect.left - cRect.left;
      const lineStartX = currentOLeft - currentOGsapX;
      const oFinalX = Math.max(0, oFinalLeft - lineStartX);
      const finalLineWidth = Math.max(0, Math.min(oFinalLeft - lineStartX - 8, cRect.width - lineStartX - 8));

      gsap.set(targetEl, { x: oFinalX });
      lineEl.style.left = `${lineStartX}px`;
      lineEl.style.width = `${finalLineWidth}px`;
      gsap.set(lineEl, { width: finalLineWidth });

      (cache as { cachedData: PortfolioData | null }).cachedData = {
        ...cache.cachedData,
        oFinalX,
        lineFinalWidth: finalLineWidth,
        iOriginalPosition: lineStartX,
        oStartX: lineStartX,
        containerWidth: cRect.width,
      };
    }, 150);
  };
  const cancel = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
  };
  return { handler, cancel };
}

// ── Recalculate line/O positions from current layout and apply (for restore after resize or return to hero) ─
function recalculateAndApplyExpandedState(
  headerRef: RefObject<HTMLDivElement | null>,
  oDragWrapperRef: RefObject<HTMLDivElement | null> | undefined,
  cache: PortfolioCacheRef,
): boolean {
  const els = getHeaderElements(headerRef);
  if (!els || !cache.cachedData) return false;
  const { portfoli, o: oEl, line: lineEl } = els;
  const targetEl = (oDragWrapperRef?.current ?? oEl) as HTMLElement;

  const cRect = headerRef.current?.getBoundingClientRect();
  if (!cRect) return false;

  void portfoli.offsetWidth;
  void oEl.offsetWidth;
  const oWidth = oEl.getBoundingClientRect().width;
  const padding = window.innerWidth < 768 ? 16 : 32;
  const viewportRight = window.innerWidth - padding;
  const absoluteEnd = Math.min(cRect.width - padding, viewportRight - cRect.left);
  const oFinalLeft = Math.min(absoluteEnd - oWidth / 2, viewportRight - cRect.left - oWidth / 2);
  const oStartLeft = oEl.getBoundingClientRect().left - cRect.left;
  const lineStartX = oStartLeft;
  const oFinalX = Math.max(0, oFinalLeft - lineStartX);
  const finalLineWidth = Math.max(0, Math.min(oFinalLeft - lineStartX - 8, cRect.width - lineStartX - 8));

  gsap.set(targetEl, { x: oFinalX });
  Object.assign(lineEl.style, {
    display: "block",
    opacity: "1",
    left: `${lineStartX}px`,
    width: `${finalLineWidth}px`,
  });
  gsap.set(lineEl, { opacity: 1, width: finalLineWidth });

  (cache as { cachedData: PortfolioData | null }).cachedData = {
    ...cache.cachedData,
    oFinalX,
    lineFinalWidth: finalLineWidth,
    iOriginalPosition: lineStartX,
    oStartX: lineStartX,
    containerWidth: cRect.width,
  };
  return true;
}

// ── Attach drag-to-open/close for O when restored from cache (keeps O always draggable) ─
function attachODragAfterRestore(
  headerRef: RefObject<HTMLDivElement | null>,
  oDragWrapperRef: RefObject<HTMLDivElement | null> | undefined,
  data: PortfolioData,
  setIsComplete: (v: boolean) => void,
  onDragStart?: () => void,
  onUserExpandChange?: (expanded: boolean) => void,
): () => void {
  const els = getHeaderElements(headerRef);
  if (!els) return () => {};
  const { o: oEl, line: lineEl } = els;
  const dragTarget = (oDragWrapperRef?.current ?? oEl) as HTMLElement;
  const oFinalX = data.oFinalX;
  const finalLineWidth = data.lineFinalWidth;

  dragTarget.style.cursor = "grab";
  dragTarget.style.pointerEvents = "auto";
  dragTarget.style.position = "relative";
  dragTarget.style.zIndex = "15";
  dragTarget.style.touchAction = "none";

  const threshold = oFinalX * 0.6;
  const quickToX = gsap.quickTo(dragTarget, "x", { duration: 0.12, ease: "power2.out" });
  const quickToLineWidth = gsap.quickTo(lineEl as unknown as gsap.TweenTarget, "width", {
    duration: 0.12,
    ease: "power2.out",
    unit: "px",
  });
  const applyDrag = (x: number) => {
    const clamped = Math.max(0, Math.min(x, oFinalX));
    quickToX(clamped);
    const lineW = Math.max(0, Math.min(clamped, finalLineWidth));
    quickToLineWidth(lineW);
    if (clamped < threshold) setIsComplete(false); // hide links as soon as user drags back
  };

  let startClientX = 0;
  let startX = 0;

  const onPointerMove = (e: PointerEvent) => {
    const dx = e.clientX - startClientX;
    applyDrag(startX + dx);
  };

  const onPointerUp = (e?: PointerEvent) => {
    if (e) dragTarget.releasePointerCapture(e.pointerId);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUpBound);
    document.removeEventListener("pointercancel", onPointerUpBound);
    dragTarget.style.cursor = "grab";
    const currentX = Number(gsap.getProperty(dragTarget, "x")) || 0;
    const expanded = currentX >= threshold;
    onUserExpandChange?.(expanded);
    if (expanded) {
      gsap.set(dragTarget, { x: oFinalX });
      lineEl.style.width = `${finalLineWidth}px`;
      gsap.set(lineEl, { width: finalLineWidth });
      dragTarget.style.pointerEvents = "auto";
      dragTarget.style.cursor = "grab";
      setIsComplete(true);
    } else {
      setIsComplete(false);
      gsap.to(dragTarget, { x: 0, duration: 0.3, ease: "power2.out" });
      gsap.to(lineEl, { width: 0, duration: 0.3, ease: "power2.out", onComplete: () => {
        const w = dragTarget.offsetWidth;
        dragTarget.style.minWidth = `${w}px`;
      }});
    }
  };

  const onPointerUpBound = (e: PointerEvent) => { onPointerUp(e); };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    onDragStart?.();
    startClientX = e.clientX;
    startX = Number(gsap.getProperty(dragTarget, "x")) || 0;
    dragTarget.style.cursor = "grabbing";
    dragTarget.setPointerCapture(e.pointerId);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUpBound);
    document.addEventListener("pointercancel", onPointerUpBound);
  };

  dragTarget.addEventListener("pointerdown", onPointerDown as EventListener);
  return () => {
    dragTarget.removeEventListener("pointerdown", onPointerDown as EventListener);
  };
}

// ── Hook ─────────────────────────────────────────────────────────────
export function usePortfolioAnimation(
  headerRef: RefObject<HTMLDivElement | null>,
  shouldAnimate: boolean,
  isActive: boolean,
  isMobile: boolean,
  onDragStart?: () => void,
  oDragWrapperRef?: RefObject<HTMLDivElement | null>,
  startAutoExpand?: boolean,
  /** When true (md range): show final state immediately, no drag/click on O */
  staticExpand?: boolean,
  /** Page's cache instance so production (Vercel) uses same object when Hero chunk reloads */
  cacheRef?: PortfolioCacheRef | null,
): { isPortfolioAnimationComplete: boolean } {
  const cache = cacheRef ?? portfolioCache;
  const [isComplete, setIsComplete] = useState(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const pendingAutoTlRef = useRef<gsap.core.Timeline | null>(null);
  const wasExpandedRef = useRef(false);
  /** True only when the user manually dragged the O to expand (not auto-expand or static layout). Used so resize lg→md→lg doesn’t show links if user never dragged. */
  const userExpandedRef = useRef(false);
  const mobileResizeCleanupRef = useRef<(() => void) | null>(null);
  const restoreResizeCleanupRef = useRef<(() => void) | null>(null);
  const hasSeenExpandedThisMountRef = useRef(false);
  const restoreAppliedRef = useRef(false);

  // When Hero unmounts (user navigated away), mark "expand portfolio when they come back".
  useEffect(() => {
    return () => {
      (cache as { expandOnReturnToHero: boolean }).expandOnReturnToHero = true;
    };
  }, [cache]);

  useEffect(() => {
    // Only track expanded state while hero is active.
    // When !isActive, the main effect already wrote the correct value to cache
    // before calling setIsComplete(false) — we must not overwrite it here.
    if (!isActive) return;
    wasExpandedRef.current = isComplete;
    if (isComplete && !staticExpand) hasSeenExpandedThisMountRef.current = true;
    if (!staticExpand) (cache as { lastExpandedWhenLeavingHero: boolean }).lastExpandedWhenLeavingHero = isComplete;
  }, [isComplete, isActive, staticExpand, cache]);

  // ── Main animation effect ──────────────────────────────────────
  useEffect(() => {
    const saveExpandedStateOnCleanup = () => {
      if (!staticExpand) {
        (cache as { lastExpandedWhenLeavingHero: boolean }).lastExpandedWhenLeavingHero = wasExpandedRef.current;
      }
    };
    const onUserExpandChange = (expanded: boolean) => {
      userExpandedRef.current = expanded;
    };

    if (!headerRef.current) return saveExpandedStateOnCleanup;

    // ── Whole "PORTFOLIO" only (no O/line): no portfolio animation, mark complete ─
    if (SKIP_PORTFOLIO_ANIMATION && !getHeaderElements(headerRef)) {
      setIsComplete(true);
      return saveExpandedStateOnCleanup;
    }

    // ── Reset when hero becomes inactive ─────────────────────────
    if (!isActive) {
      // Only save "was expanded" when we're actually leaving hero. When we're mounting with isActive false (returning to hero), don't overwrite — we need lastExpandedWhenLeavingHero for the restore branch.
      if (!cache.expandOnReturnToHero) {
        (cache as { lastExpandedWhenLeavingHero: boolean }).lastExpandedWhenLeavingHero = wasExpandedRef.current;
      }
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
        dragCleanupRef.current = null;
      }
      restoreResizeCleanupRef.current?.();
      restoreResizeCleanupRef.current = null;
      setIsComplete(false);
      if (!cache.everCompleted) {
        const els = getHeaderElements(headerRef);
        if (els) {
          gsap.set(els.full, { opacity: 1, display: "block" });
          gsap.set([els.portfoli, els.o], { opacity: 0, display: "none", x: 0, y: 0, rotation: 0 });
          gsap.set(els.line, { opacity: 0, display: "none", width: 0 });
          els.line.style.left = "";
        }
      }
      return saveExpandedStateOnCleanup;
    }

    // ── Restore when back on hero or after resize ────────────────────────────────────────────────
    // Rule: expand if (page or unmount set expandOnReturnToHero) OR (was expanded when we left).
    const canRestore = !!(cache.cachedData && cache.dataCalculated && cache.everCompleted);
    if (isActive && canRestore) {
      // Don't clear expandOnReturnToHero here — effect can run twice; second run would see false and collapse. Clear only after we apply expand inside rAF.
      const expandOnReturn = cache.expandOnReturnToHero;
      const shouldExpand = expandOnReturn || cache.lastExpandedWhenLeavingHero;
      const { handler: handleResize, cancel: cancelResize } = createResizeHandler(headerRef, oDragWrapperRef, cache);
      const applyRestore = () => {
        if (restoreAppliedRef.current || !headerRef.current) return;
        restoreAppliedRef.current = true;
        if (expandOnReturn) (cache as { expandOnReturnToHero: boolean }).expandOnReturnToHero = false;
        if (dragCleanupRef.current) dragCleanupRef.current();
        dragCleanupRef.current = null;
        restoreResizeCleanupRef.current?.();
        restoreResizeCleanupRef.current = null;

        if (staticExpand) {
          restoreFinalState(headerRef, cache.cachedData!);
          if (oDragWrapperRef?.current) gsap.set(oDragWrapperRef.current, { x: cache.cachedData!.oFinalX });
          setIsComplete(true);
          return;
        }
        if (!shouldExpand) {
          userExpandedRef.current = false;
          dragCleanupRef.current = restoreCollapsedState(headerRef, cache.cachedData!, oDragWrapperRef, setIsComplete, onDragStart, onUserExpandChange) ?? null;
          return;
        }
        userExpandedRef.current = true;
        restoreFinalState(headerRef, cache.cachedData!);
        recalculateAndApplyExpandedState(headerRef, oDragWrapperRef, cache);
        if (oDragWrapperRef?.current) gsap.set(oDragWrapperRef.current, { x: cache.cachedData!.oFinalX });
        setIsComplete(true);
        dragCleanupRef.current = attachODragAfterRestore(headerRef, oDragWrapperRef, cache.cachedData!, setIsComplete, onDragStart, onUserExpandChange);
        window.addEventListener("resize", handleResize);
        restoreResizeCleanupRef.current = () => {
          cancelResize();
          window.removeEventListener("resize", handleResize);
        };
      };
      // Double rAF then short delay so hero is visible and laid out before we measure and set line/O
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(applyRestore, 50);
        });
      });
      return () => {
        restoreAppliedRef.current = false;
        saveExpandedStateOnCleanup();
        restoreResizeCleanupRef.current?.();
        restoreResizeCleanupRef.current = null;
        if (dragCleanupRef.current) {
          dragCleanupRef.current();
          dragCleanupRef.current = null;
        }
      };
    }

    // ── Wait for dot animation to start ──────────────────────────
    if (!shouldAnimate) return saveExpandedStateOnCleanup;

    // ── Cached: jump to final state (e.g. same session, effect re-ran after resize) ──────────────────────────────
    if (cache.cachedData && cache.dataCalculated) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (dragCleanupRef.current) dragCleanupRef.current();
          if (staticExpand) {
            restoreFinalState(headerRef, cache.cachedData!);
            if (oDragWrapperRef?.current) gsap.set(oDragWrapperRef.current, { x: cache.cachedData!.oFinalX });
            setIsComplete(true);
            return;
          }
          if (!wasExpandedRef.current) {
            userExpandedRef.current = false;
            dragCleanupRef.current = restoreCollapsedState(headerRef, cache.cachedData!, oDragWrapperRef, setIsComplete, onDragStart, onUserExpandChange) ?? null;
            return;
          }
          userExpandedRef.current = true;
          restoreFinalState(headerRef, cache.cachedData!);
          recalculateAndApplyExpandedState(headerRef, oDragWrapperRef, cache);
          if (oDragWrapperRef?.current) gsap.set(oDragWrapperRef.current, { x: cache.cachedData!.oFinalX });
          setIsComplete(true);
          dragCleanupRef.current = attachODragAfterRestore(headerRef, oDragWrapperRef, cache.cachedData!, setIsComplete, onDragStart, onUserExpandChange);
        });
      });
      return saveExpandedStateOnCleanup;
    }

    // ── Fresh animation ──────────────────────────────────────────
    setIsComplete(false);

    const els = getHeaderElements(headerRef);
    if (!els) return saveExpandedStateOnCleanup;
    const { full, portfoli, o: oEl, line: lineEl } = els;

    // ── Mobile or static (md): show final state immediately; only attach drag when mobile and not static ───
    if (isMobile || staticExpand) {
      full.style.display = "none";
      portfoli.style.display = "inline";
      portfoli.style.opacity = "1";
      oEl.style.display = "inline";
      oEl.style.opacity = "1";
      lineEl.style.display = "block";
      lineEl.style.opacity = "1";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const containerRect = headerRef.current?.getBoundingClientRect();
          if (!containerRect) return;

          const padding = window.innerWidth < 768 ? 16 : 32;
          const viewportRight = window.innerWidth - padding;
          const absoluteEnd = Math.min(containerRect.width - padding, viewportRight - containerRect.left);
          void portfoli.offsetWidth;
          void oEl.offsetWidth;

          const oRect = oEl.getBoundingClientRect();
          const oWidth = oRect.width;
          const oFinalLeft = Math.min(absoluteEnd - oWidth / 2, viewportRight - containerRect.left - oWidth / 2);
          const oStartLeft = oRect.left - containerRect.left;
          const oFinalX = oFinalLeft - oStartLeft;
          const finalLineWidth = Math.max(0, oFinalLeft - oStartLeft - 8);

          const mobileWrapper = oDragWrapperRef?.current;
          if (mobileWrapper) {
            gsap.set(mobileWrapper, { x: oFinalX });
            if (!staticExpand) {
              (mobileWrapper as HTMLElement).style.touchAction = "none";
              (mobileWrapper as HTMLElement).style.pointerEvents = "auto";
              (mobileWrapper as HTMLElement).style.cursor = "grab";
            } else {
              (mobileWrapper as HTMLElement).style.pointerEvents = "none";
              (mobileWrapper as HTMLElement).style.cursor = "default";
            }
          } else {
            gsap.set(oEl, { x: oFinalX, opacity: 1 });
          }
          Object.assign(lineEl.style, {
            top: "50%",
            position: "absolute",
            left: `${oStartLeft}px`,
            width: `${finalLineWidth}px`,
            opacity: "1",
            display: "block",
            transform: "translateY(-50%)",
            zIndex: "1",
          });

          const portfoliRect = portfoli.getBoundingClientRect();
          (cache as { cachedData: PortfolioData | null }).cachedData = {
            portfolWidth: portfoliRect.width,
            oFinalX,
            lineFinalWidth: finalLineWidth,
            iOriginalPosition: oStartLeft,
            oStartX: oStartLeft,
            iWidth: 0,
            containerWidth: containerRect.width,
          };
          (cache as { dataCalculated: boolean }).dataCalculated = true;
          (cache as { everCompleted: boolean }).everCompleted = true;
          setIsComplete(true);
          if (!staticExpand) {
            if (dragCleanupRef.current) dragCleanupRef.current();
            dragCleanupRef.current = attachODragAfterRestore(headerRef, oDragWrapperRef, cache.cachedData!, setIsComplete, onDragStart, onUserExpandChange);
          }
          // Resize handler so O and line stay in view when user resizes after expansion
          const { handler: handleResizeMobile, cancel: cancelResizeMobile } = createResizeHandler(headerRef, oDragWrapperRef, cache);
          window.addEventListener("resize", handleResizeMobile);
          mobileResizeCleanupRef.current = () => {
            cancelResizeMobile();
            window.removeEventListener("resize", handleResizeMobile);
          };
        });
      });
      return () => {
        saveExpandedStateOnCleanup();
        if (dragCleanupRef.current) {
          dragCleanupRef.current();
          dragCleanupRef.current = null;
        }
        mobileResizeCleanupRef.current?.();
        mobileResizeCleanupRef.current = null;
      };
    }


    // ── Desktop: shake PORTFOLIO → O rolls to final position ────────────
    // Triggered by startAutoExpand (dot lands on "ı").
    // 1. PORTFOLI + O revealed; line hidden at zero width
    // 2. Dot-impact shake: PORTFOLI + O jolt left-right together
    // 3. O rolls rightward (x only); line grows in sync
    // 4. O locks at final position — drag active from the start

    let oFinalX = 0;
    let finalLineWidth = 0;

    const tl = gsap.timeline();

    tl.call(() => {
      // ── Reveal PORTFOLI + O; hide full word ──────────────────────
      const wrapper = oDragWrapperRef?.current;
      if (wrapper) { wrapper.style.minWidth = ""; gsap.set(wrapper, { x: 0 }); }
      full.style.display     = "none";
      portfoli.style.display = "inline";
      oEl.style.display      = "inline";
      gsap.set([portfoli, oEl], { display: "inline", opacity: 1, rotation: 0, x: 0 });
      gsap.set(oEl, { position: "relative" });
      // lineEl display:block is set below after oStartLeft is computed

      const cRect = headerRef.current?.getBoundingClientRect();
      if (!cRect) return;

      void oEl.offsetWidth;
      const dragTarget = (oDragWrapperRef?.current ?? oEl) as HTMLElement;
      const oRect      = oEl.getBoundingClientRect();
      const oWidth     = oRect.width;
      const oStartLeft = oRect.left - cRect.left;
      const padding    = window.innerWidth < 768 ? 16 : 32;
      const vpRight    = window.innerWidth - padding;
      const absEnd     = Math.min(cRect.width - padding, vpRight - cRect.left);
      const oFinalLeft = Math.min(absEnd - oWidth / 2, vpRight - cRect.left - oWidth / 2);

      oFinalX        = oFinalLeft - oStartLeft;
      finalLineWidth = Math.max(0, oFinalLeft - oStartLeft - 8);

      // Keep display:block from the start so GSAP width tweens are visible immediately.
      // Only hide via width:0 — never display:none after this point.
      Object.assign(lineEl.style, {
        display: "block", left: `${oStartLeft}px`, width: "0px", opacity: "0",
      });
      gsap.set(lineEl, { opacity: 0, width: 0 });
      gsap.set(oEl, { clearProps: "x" });

      const portfoliRect = portfoli.getBoundingClientRect();
      (cache as { cachedData: PortfolioData | null }).cachedData = {
        portfolWidth:      portfoliRect.width,
        oFinalX,
        lineFinalWidth:    finalLineWidth,
        iOriginalPosition: oStartLeft,
        oStartX:           oStartLeft,
        iWidth:            0,
        containerWidth:    cRect.width,
      };
      (cache as { dataCalculated: boolean }).dataCalculated = true;
      (cache as { everCompleted: boolean }).everCompleted = true;

      dragTarget.style.minWidth = `${dragTarget.offsetWidth}px`;

      // ── Roll timeline (paused — played by startAutoExpand effect) ────────
      // Timings:
      //   0.00 – 0.50s  shake  (heavy impact — PORTFOLI + dragTarget, x only)
      //   0.50 – 0.80s  pause  (inertia building)
      //   0.80 – 3.00s  roll   (x only on dragTarget — asymmetric friction curve)
      //   3.00s          lock in

      const shakeDur  = 0.50;
      const pauseDur  = 0.30;
      const rollDur   = 2.20;
      const rollStart = shakeDur + pauseDur; // 0.80s

      const rollTl = gsap.timeline({ paused: true });

      // ── Phase 1: Impact shake — vertical squash like Mariam ────────────
      // Mariam scaleY squashes to 0.88 then springs back with back.out.
      // PORTFOLIO mirrors that: squash down, spring up.
      // Target the header container so all letters compress together.
      const headerEl = headerRef.current!;
      gsap.set(headerEl, { transformOrigin: "50% 100%" });
      rollTl.to(headerEl, {
        scaleY: 0.88,
        duration: 0.13,
        ease: "sine.in",
        force3D: false,
      }, 0);
      rollTl.to(headerEl, {
        scaleY: 1,
        duration: 0.38,
        ease: "back.out(1.08)",
        force3D: false,
        onComplete() { gsap.set(headerEl, { clearProps: "scaleY,transformOrigin" }); },
      }, 0.13);

      // Fade the line in just as the roll begins (already display:block)
      rollTl.to(lineEl, { opacity: 1, duration: 0.18, ease: "power2.out" }, rollStart);

      // ── Phase 2: Roll (x only) ────────────────────────────────────────────
      // Two tweens give an asymmetric curve: slow friction start, then ease out.
      const halfX   = oFinalX * 0.5;
      const halfDur = rollDur * 0.45;
      const restDur = rollDur - halfDur;

      rollTl.to(dragTarget, {
        x: halfX,
        duration: halfDur,
        ease: "power2.in",
        onUpdate() {
          const cx = gsap.getProperty(dragTarget, "x") as number;
          lineEl.style.width = `${Math.max(0, Math.min(cx, finalLineWidth))}px`;
        },
      }, rollStart);

      rollTl.to(dragTarget, {
        x: oFinalX,
        duration: restDur,
        ease: "power2.out",
        onUpdate() {
          const cx = gsap.getProperty(dragTarget, "x") as number;
          lineEl.style.width = `${Math.max(0, Math.min(cx, finalLineWidth))}px`;
        },
      }, rollStart + halfDur);

      // ── Lock in ───────────────────────────────────────────────────────────
      rollTl.call(() => {
        gsap.set(dragTarget, { x: oFinalX });
        lineEl.style.width = `${finalLineWidth}px`;
        gsap.set(lineEl, { width: finalLineWidth });
        dragTarget.style.cursor        = "grab";
        dragTarget.style.pointerEvents = "auto";
        setIsComplete(true);
      }, [], rollStart + rollDur + 0.05);

      pendingAutoTlRef.current = rollTl;

      // ── Drag (active from frame 1 — user can grab O at any moment) ───────
      dragTarget.style.cursor        = "grab";
      dragTarget.style.pointerEvents = "auto";
      dragTarget.style.position      = "relative";
      dragTarget.style.zIndex        = "15";
      dragTarget.style.touchAction   = "none";

      const quickX    = gsap.quickTo(dragTarget, "x", { duration: 0.12, ease: "power2.out" });
      const quickLine = gsap.quickTo(
        lineEl as unknown as gsap.TweenTarget, "width",
        { duration: 0.12, ease: "power2.out", unit: "px" },
      );
      const threshold = oFinalX * 0.6;

      const applyDrag = (x: number) => {
        const c = Math.max(0, Math.min(x, oFinalX));
        quickX(c);
        quickLine(Math.max(0, Math.min(c, finalLineWidth)));
        if (c < threshold) setIsComplete(false);
      };

      let startCX = 0, startX2 = 0;
      const onMove = (e: PointerEvent) => applyDrag(startX2 + (e.clientX - startCX));

      const onUp = (e?: PointerEvent) => {
        if (e) dragTarget.releasePointerCapture(e.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup",   onUpE);
        document.removeEventListener("pointercancel", onUpE);
        dragTarget.style.cursor = "grab";
        const cx = (gsap.getProperty(dragTarget, "x") as number) || 0;
        userExpandedRef.current = cx >= threshold;
        if (cx >= threshold) {
          gsap.to(dragTarget, { x: oFinalX, duration: 0.35, ease: "power2.out" });
          gsap.to(lineEl, {
            width: finalLineWidth, duration: 0.35, ease: "power2.out",
            onComplete() {
              gsap.set(dragTarget, { x: oFinalX });
              lineEl.style.width             = `${finalLineWidth}px`;
              dragTarget.style.cursor        = "grab";
              dragTarget.style.pointerEvents = "auto";
              setIsComplete(true);
            },
          });
        } else {
          setIsComplete(false);
          gsap.to(dragTarget, { x: 0, duration: 0.3, ease: "power2.out" });
          gsap.to(lineEl, {
            width: 0, duration: 0.3, ease: "power2.out",
            onComplete() { dragTarget.style.minWidth = `${dragTarget.offsetWidth}px`; },
          });
        }
      };
      const onUpE = (e: PointerEvent) => onUp(e);

      const onDown = (e: PointerEvent) => {
        e.preventDefault();
        // Kill roll animation the instant user grabs O
        if (rollTl.isActive()) {
          rollTl.kill();
          pendingAutoTlRef.current = null;
          gsap.set(headerEl, { clearProps: "scaleY,transformOrigin" });
        }
        // Always ensure line is visible before drag starts —
        // opacity may still be 0 if user grabs before rollTl ever plays
        gsap.set(lineEl, { opacity: 1, display: "block" });
        onDragStart?.();
        startCX  = e.clientX;
        startX2  = (gsap.getProperty(dragTarget, "x") as number) || 0;
        dragTarget.style.cursor = "grabbing";
        dragTarget.setPointerCapture(e.pointerId);
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup",   onUpE);
        document.addEventListener("pointercancel", onUpE);
      };

      dragTarget.addEventListener("pointerdown", onDown as EventListener);
    });

    // Resize handler — repositions O + line when already expanded after a viewport resize
    const { handler: handleResize, cancel: cancelResize } = createResizeHandler(headerRef, oDragWrapperRef, cache);
    window.addEventListener("resize", handleResize);

    return () => {
      saveExpandedStateOnCleanup();
      cancelResize();
      window.removeEventListener("resize", handleResize);
      if (pendingAutoTlRef.current) { pendingAutoTlRef.current.kill(); pendingAutoTlRef.current = null; }
      if (dragCleanupRef.current) { dragCleanupRef.current(); dragCleanupRef.current = null; }
      tl.kill();
    };
  }, [isActive, shouldAnimate, isMobile, staticExpand, headerRef, oDragWrapperRef, cache]);

  // When startAutoExpand becomes true (e.g. dot landed / Software Engineer appears), run auto animation only if user hasn't expanded yet
  useEffect(() => {
    if (!startAutoExpand || isComplete) return;
    const tl = pendingAutoTlRef.current;
    if (tl) tl.play();
  }, [startAutoExpand, isComplete]);

  return { isPortfolioAnimationComplete: isComplete };
}
