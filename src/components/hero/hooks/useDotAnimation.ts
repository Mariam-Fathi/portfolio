import { useEffect, useState, type RefObject } from "react";
import gsap from "gsap";
import { COLORS, TIMING } from "../constants";
import { checkIsMobile } from "./useIsMobile";
import type { DotPositions } from "../types";

// ── Module-level cache (survives unmount / remount) ─────────────────
// IMPORTANT – React 18 Strict Mode double-invokes effects in development.
// The first invocation may set animationEverCompleted = true, causing the
// second invocation to skip the animation and restore the cached final state.
// This is expected in development and does NOT happen in production builds.
// If you need to test the first-visit animation locally, disable Strict Mode
// temporarily or use a private/incognito window and hard-reload.
let animationEverCompleted = false;

export function resetDotCache() {
  animationEverCompleted = false;
}

export function hasDotAnimationEverCompleted() {
  return animationEverCompleted;
}

// ── Calculate dot positions from SVG tspan elements ──────────────────
function calculatePositions(
  svgI: SVGTSpanElement,
  svgA2: SVGTSpanElement,
  svgM2: SVGTSpanElement,
): DotPositions {
  const iRect = svgI.getBoundingClientRect();
  const a2Rect = svgA2.getBoundingClientRect();
  const m2Rect = svgM2.getBoundingClientRect();

  const isMobile = checkIsMobile();
  // Use height (proportional to font size) rather than width (narrow for "ı")
  const baseDotSize = iRect.height * 0.135;
  // Mobile dot was too small on the "ı" target in smaller viewports.
  // Keep desktop sizing unchanged.
  const dotSize = isMobile ? baseDotSize * 0.75 : baseDotSize;

  return {
    iScreenX: iRect.left + iRect.width / 2,
    iScreenY: iRect.top + iRect.height * 0.19,
    iCenterY: iRect.top + iRect.height / 2,
    a2ScreenX: a2Rect.left + a2Rect.width / 2,
    a2ScreenY: a2Rect.top + a2Rect.height / 2,
    m2ScreenX: m2Rect.left + m2Rect.width / 2,
    m2ScreenY: m2Rect.top + m2Rect.height / 2,
    dotSize,
    finalDotSize: dotSize,
  };
}

// ── Place dot at its resting position on "ı" ─────────────────────────
function setDotAtFinal(dot: HTMLDivElement, pos: DotPositions) {
  // finalDotSize is already mobile-adjusted from calculatePositions
  const size = pos.finalDotSize;

  Object.assign(dot.style, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor: COLORS.accent,
    position: "fixed",
    top: "0px",
    left: "0px",
    opacity: "1",
    display: "block",
    visibility: "visible",
    pointerEvents: "none",
    transformOrigin: "center center",
  });

  gsap.set(dot, {
    x: pos.iScreenX - size / 2,
    y: pos.iScreenY,
    scale: 1,
    opacity: 1,
  });
}

// ── Color the "iam" letters in accent color ──────────────────────────
function colorLetters(
  svgI: SVGTSpanElement | null,
  svgA2: SVGTSpanElement | null,
  svgM2: SVGTSpanElement | null,
) {
  [svgI, svgA2, svgM2].forEach((el) => {
    if (el) gsap.set(el, { fill: COLORS.accent });
  });
}

// ── Build the bouncing-dot GSAP timeline ─────────────────────────────
// Narrative: dot starts on "ı", wiggles, breaks free across "a" & "m",
// falls off-screen; a new dot drops from above, lands on "ı", rests,
// then fades out — triggering the "software engineer" reveal.
//
// Physics model: gravity easing (power2.in = falling acceleration,
// power2/3.out = rising deceleration), volume-preserving squash/stretch,
// 3 diminishing bounces per landing, true parabolic arcs via separate
// x (linear) and y (gravity) tweens.
//
// Parameters are grouped into two objects to prevent the 11-argument smell
// and make call-sites resilient to future additions.
interface DotTimelineRefs {
  svgI: SVGTSpanElement;
  svgA2: SVGTSpanElement;
  svgM2: SVGTSpanElement;
}
interface DotTimelineCallbacks {
  onComplete: () => void;
  onDotFallenFromM?: () => void;
  onDotLandedOnI?: () => void;
}
function buildDotTimeline(
  dot: HTMLDivElement,
  pos: DotPositions,
  refs: DotTimelineRefs,
  callbacks: DotTimelineCallbacks,
  skipIntro = false,
): gsap.core.Timeline {
  const { svgI, svgA2, svgM2 } = refs;
  const { onComplete, onDotFallenFromM, onDotLandedOnI } = callbacks;
  const { iScreenX, iScreenY, a2ScreenX, a2ScreenY, m2ScreenX, m2ScreenY, finalDotSize } = pos;
  const d = finalDotSize;
  const half = d / 2;
  // Capture viewport height at build time. We add a generous buffer (+200) so
  // the dot always falls well below the fold even if the user resizes the
  // viewport taller during the animation. If the window shrinks, the dot is
  // already off-screen before it reaches the computed target, which is fine.
  const viewportBottom = window.innerHeight + 200;

  const dotBase = COLORS.accent;
  const dotMotion = COLORS.dotMotion;
  const dotLand = COLORS.dotLand;
  const dotGhost = COLORS.dotGhost;
  const dotFallLight = COLORS.dotFallLight;
  const dotOnIFloor = COLORS.accent;

  const dropHeight = 72; // height above "ı" when not clicked (auto fall)

  if (!skipIntro) {
    Object.assign(dot.style, {
      width: `${d}px`,
      height: `${d}px`,
      borderRadius: "50%",
      backgroundColor: COLORS.primary,
      position: "fixed",
      top: "0px",
      left: "0px",
      opacity: "1",
      display: "block",
      visibility: "visible",
      pointerEvents: "none",
      transformOrigin: "center center",
    });
    gsap.set(dot, {
      x: iScreenX - half,
      y: iScreenY - dropHeight,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    });
  } else {
    dot.style.pointerEvents = "none";
  }

  const tl = gsap.timeline({ paused: true });

  // When starting from hover (skipIntro), set dot size and origin as timeline runs so jumps use correct state
  if (skipIntro) {
    tl.call(() => {
      dot.style.width = `${d}px`;
      dot.style.height = `${d}px`;
      dot.style.transformOrigin = "50% 50%";
    }, [], 0);
  }

  // ── Jump from "ı" to "a" — same arc realism as jump from "a" to "m" ────
  const iaH = 260;
  const iaDx = a2ScreenX - iScreenX;
  const iaDy = a2ScreenY - iScreenY;
  const iaX = (t: number) => iScreenX + iaDx * t - half;
  const iaY = (t: number) => iScreenY + iaDy * t - iaH * 4 * t * (1 - t);

  if (skipIntro) {
    // Click from hover: continue from expand motion — no fall into ı. Flow from current (expanded) pose into launch squash, then arc.
    tl.to(dot, {
      x: iScreenX - half,
      y: iScreenY + 5,
      scaleX: 1.28,
      scaleY: 0.7,
      backgroundColor: dotOnIFloor,
      duration: 0.14,
      ease: "power2.in",
      onStart: () => {
        if (svgI) gsap.to(svgI, { fill: COLORS.accent, duration: 0.35, ease: "power2.out" });
      },
    });
  } else {
    // Intro: fall onto "ı", impact, pause, then anticipation and jump
    // Fall onto "ı" — from above, one gravity drop
    tl.to(dot, {
      y: iScreenY,
      scaleY: 1.08,
      scaleX: 0.94,
      backgroundColor: dotFallLight,
      duration: 0.4,
      ease: "power3.in",
    });

    // Impact on "ı" — same 3-phase physics as land on "a": absorb, compress, settle
    tl.to(dot, {
      keyframes: [
        {
          scaleY: 0.55,
          scaleX: 1.45,
          backgroundColor: dotOnIFloor,
          duration: 0.06,
          ease: "power3.in",
          onComplete: () => { gsap.to(svgI, { fill: COLORS.accent, duration: 0.35, ease: "power2.out" }); },
        },
        { y: iScreenY + 5, scaleY: 0.45, scaleX: 1.55, duration: 0.08, ease: "power1.in" },
        { y: iScreenY, scaleY: 1, scaleX: 1, duration: 0.24, ease: "power2.out" },
      ],
    });

    // Pause on "ı" so we read: landed, then jump to "a"
    tl.to(dot, { duration: 0.28 });

    // Anticipation then launch (match a→m style)
    tl.to(dot, {
      keyframes: [
        { y: iScreenY + 3, scaleX: 1.2, scaleY: 0.8, backgroundColor: dotOnIFloor, duration: 0.14, ease: "power2.in" },
        { y: iScreenY + 5, scaleX: 1.28, scaleY: 0.7, duration: 0.06, ease: "sine.in" },
      ],
    });
  }

  // Parabolic arc ı→a — same keyframe structure and stretch as a→m
  tl.to(dot, {
    keyframes: [
      { x: iaX(0.06), y: iaY(0.06), scaleY: 1.3, scaleX: 0.78, backgroundColor: dotLand, duration: 0.06, ease: "power3.out" },
      { x: iaX(0.14), y: iaY(0.14), scaleY: 1.18, scaleX: 0.86, backgroundColor: dotMotion, duration: 0.08, ease: "power2.out" },
      { x: iaX(0.24), y: iaY(0.24), scaleY: 1.08, scaleX: 0.93, duration: 0.09, ease: "sine.out" },
      { x: iaX(0.36), y: iaY(0.36), scaleY: 1.02, scaleX: 0.98, backgroundColor: dotBase, duration: 0.1, ease: "sine.out" },
      { x: iaX(0.48), y: iaY(0.48), scaleY: 1, scaleX: 1, duration: 0.09, ease: "none" },
      { x: iaX(0.58), y: iaY(0.58), scaleY: 1, scaleX: 1, duration: 0.09, ease: "none" },
      { x: iaX(0.68), y: iaY(0.68), scaleY: 1.03, scaleX: 0.97, backgroundColor: dotMotion, duration: 0.09, ease: "sine.in" },
      { x: iaX(0.78), y: iaY(0.78), scaleY: 1.08, scaleX: 0.93, duration: 0.09, ease: "power1.in" },
      { x: iaX(0.87), y: iaY(0.87), scaleY: 1.14, scaleX: 0.88, duration: 0.08, ease: "power1.in" },
      { x: iaX(0.94), y: iaY(0.94), scaleY: 1.2, scaleX: 0.84, duration: 0.07, ease: "power2.in" },
      { x: a2ScreenX - half, y: a2ScreenY, scaleY: 1.25, scaleX: 0.82, duration: 0.06, ease: "power2.in" },
    ],
  });

  // ── Land on "a": reactive bounce — surface absorbs then fires ────
  // The "a" acts like a trampoline: deep compression stores energy,
  // then the surface launches the dot toward "m" with MORE force.
  tl.to(dot, {
    keyframes: [
      // Impact — surface absorbs kinetic energy
      {
        scaleY: 0.55, scaleX: 1.45, backgroundColor: dotLand, duration: 0.06, ease: "power3.in",
        onComplete: () => { gsap.to(svgA2, { fill: COLORS.accent, duration: 0.35, ease: "power2.out" }); },
      },
      // Maximum compression — surface fully loaded, slight sink
      { y: a2ScreenY + 5, scaleY: 0.45, scaleX: 1.55, duration: 0.08, ease: "power1.in" },
      // Surface fires back — explosive upward stretch into launch
      { y: a2ScreenY - 25, scaleY: 1.4, scaleX: 0.72, backgroundColor: dotMotion, duration: 0.1, ease: "power3.out" },
    ],
  });

  // ── Parabolic arc from "a" to "m" — powered by surface energy ───
  // Higher arc (260 vs 210) — the "a" surface gave the dot extra energy
  const amH = 260;
  const amDx = m2ScreenX - a2ScreenX;
  const amDy = m2ScreenY - a2ScreenY;
  const amX = (t: number) => a2ScreenX + amDx * t - half;
  const amY = (t: number) => a2ScreenY + amDy * t - amH * 4 * t * (1 - t);

  // Immediate arc — no pause, the surface energy propels directly
  tl.to(dot, {
    keyframes: [
      { x: amX(0.06), y: amY(0.06), scaleY: 1.3, scaleX: 0.78, duration: 0.06, ease: "power3.out" },
      { x: amX(0.14), y: amY(0.14), scaleY: 1.18, scaleX: 0.86, duration: 0.08, ease: "power2.out" },
      { x: amX(0.24), y: amY(0.24), scaleY: 1.08, scaleX: 0.93, duration: 0.09, ease: "sine.out" },
      { x: amX(0.36), y: amY(0.36), scaleY: 1.02, scaleX: 0.98, backgroundColor: dotBase, duration: 0.1, ease: "sine.out" },
      { x: amX(0.48), y: amY(0.48), scaleY: 1, scaleX: 1, duration: 0.09, ease: "none" },
      { x: amX(0.58), y: amY(0.58), scaleY: 1, scaleX: 1, duration: 0.09, ease: "none" },
      { x: amX(0.68), y: amY(0.68), scaleY: 1.03, scaleX: 0.97, backgroundColor: dotMotion, duration: 0.09, ease: "sine.in" },
      { x: amX(0.78), y: amY(0.78), scaleY: 1.08, scaleX: 0.93, duration: 0.09, ease: "power1.in" },
      { x: amX(0.87), y: amY(0.87), scaleY: 1.14, scaleX: 0.88, duration: 0.08, ease: "power1.in" },
      { x: amX(0.94), y: amY(0.94), scaleY: 1.2, scaleX: 0.84, duration: 0.07, ease: "power2.in" },
      { x: m2ScreenX - half, y: m2ScreenY, scaleY: 1.25, scaleX: 0.82, duration: 0.06, ease: "power2.in" },
    ],
  });

  // ── Land on "m": impact + immediate fall off ────────────────────
  tl.to(dot, {
    keyframes: [
      {
        scaleY: 0.6, scaleX: 1.35, backgroundColor: dotLand, duration: 0.05, ease: "power3.in",
        onComplete: () => { gsap.to(svgM2, { fill: COLORS.accent, duration: 0.35, ease: "power2.out" }); },
      },
      // Brief compression — surface doesn't hold, dot skids off
      { y: m2ScreenY + 3, scaleY: 0.5, scaleX: 1.45, duration: 0.06, ease: "power1.in" },
      // Small bounce up — just enough to leave the surface
      { y: m2ScreenY - 30, scaleY: 1.12, scaleX: 0.9, backgroundColor: dotBase, duration: 0.14, ease: "power2.out" },
      // Hang at the peak for a beat
      { y: m2ScreenY - 32, scaleY: 1, scaleX: 1, backgroundColor: dotGhost, duration: 0.06, ease: "none" },
    ],
  });

  // ── Fall off screen — gravity wins ─────────────────────────────
  tl.to(dot, {
    keyframes: [
      { y: viewportBottom, scaleY: 1.2, scaleX: 0.84, opacity: 0, duration: 0.45, ease: "power2.in" },
    ],
  });
  tl.call(() => onDotFallenFromM?.());
  tl.set(dot, { display: "none" }, "+=0.3");

  // ── New dot drops onto "ı" and rests (close the loop) ─────────────
  const dropX = iScreenX - half;
  const dropY = iScreenY;
  tl.call(() => {
    dot.style.width = `${d}px`;
    dot.style.height = `${d}px`;
    dot.style.borderRadius = "50%";
    dot.style.transformOrigin = "50% 50%";
  });
  tl.set(dot, {
    x: dropX,
    y: -(d + 100),
    opacity: 1,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    backgroundColor: dotBase,
    display: "block",
    visibility: "visible",
  });
  tl.to(dot, {
    keyframes: [
      { x: dropX - 5, duration: 0.2, ease: "power1.inOut" },
      { x: dropX + 5, duration: 0.2, ease: "power1.inOut" },
      { x: dropX, duration: 0.2, ease: "power1.inOut" },
    ],
  });
  const textEl = svgI.parentElement as SVGTextElement | null;
  const runLetterTouch = () => {
    gsap.to(svgI, { fill: COLORS.accent, duration: 0.28, ease: "sine.out" });
    if (textEl) {
      const textR = textEl.getBoundingClientRect();
      const iR = svgI.getBoundingClientRect();
      const originX = iR.left - textR.left + iR.width / 2;
      const originY = iR.bottom - textR.top;
      gsap.set(textEl, { transformOrigin: `${originX}px ${originY}px` });
      gsap.to(textEl, {
        scaleY: 0.88,
        duration: TIMING.letterTouchSquash,
        ease: "sine.in",
        force3D: false,
      });
      gsap.to(textEl, {
        scaleY: 1,
        duration: TIMING.letterTouchSpring,
        ease: "back.out(1.08)",
        delay: TIMING.letterTouchSquash,
        force3D: false,
      });
    }
  };
  tl.to(dot, {
    y: dropY,
    backgroundColor: dotFallLight,
    duration: TIMING.dotFall,
    ease: "power3.in",
  });
  tl.call(runLetterTouch);
  tl.to(dot, {
    keyframes: [
      {
        y: iScreenY + 4,
        scaleY: 0.82,
        scaleX: 1.14,
        backgroundColor: dotLand,
        duration: TIMING.dotTouchImpact,
        ease: "power2.in",
      },
      {
        y: iScreenY,
        scaleY: 1,
        scaleX: 1,
        backgroundColor: dotBase,
        duration: TIMING.dotTouchSettle,
        ease: "back.out(1.06)",
        onComplete: () => onDotLandedOnI?.(),
      },
    ],
  });
  tl.to(dot, {
    opacity: 1,
    scale: 1,
    duration: 0,
    ease: "none",
    onComplete: () => {
      setDotAtFinal(dot, pos);
      animationEverCompleted = true;
      onComplete();
    },
  }, "+=0.5");

  return tl;
}

// ── Hook ─────────────────────────────────────────────────────────────
export function useDotAnimation(
  svgRef: RefObject<SVGSVGElement | null>,
  svgIRef: RefObject<SVGTSpanElement | null>,
  svgA2Ref: RefObject<SVGTSpanElement | null>,
  svgM2Ref: RefObject<SVGTSpanElement | null>,
  dotRef: RefObject<HTMLDivElement | null>,
  /** Used to hide/show the liquid-drop elements when the hero section becomes
   *  inactive. It is NOT passed into buildDotTimeline — liquid-drop animation
   *  logic lives separately and will be wired up there when implemented. */
  liquidDropsRef: RefObject<HTMLDivElement | null>,
  isActive: boolean,
  isMariamReady: boolean,
  isMobile: boolean,
  shouldAnimate: boolean,
  onDotLandedOnI?: () => void,
): { isDotAnimationStarted: boolean; isDotAnimationComplete: boolean; isDotFallenFromM: boolean } {
  const [isDotStarted, setIsDotStarted] = useState(false);
  const [isDotComplete, setIsDotComplete] = useState(false);
  const [isDotFallenFromM, setIsDotFallenFromM] = useState(false);

  // ── Hide dots and liquid drops when hero is inactive; reset "ı" transform ───────
  useEffect(() => {
    if (!isActive) {
      if (dotRef.current) {
        gsap.killTweensOf(dotRef.current);
        Object.assign(dotRef.current.style, {
          display: "none",
          opacity: "0",
          visibility: "hidden",
        });
      }
      if (liquidDropsRef?.current) {
        liquidDropsRef.current.style.display = "none";
        liquidDropsRef.current.style.visibility = "hidden";
      }
      if (svgIRef.current) {
        gsap.killTweensOf(svgIRef.current);
        gsap.set(svgIRef.current, { scaleY: 1 });
      }
      const textEl = svgIRef.current?.parentElement;
      if (textEl) {
        gsap.killTweensOf(textEl);
        gsap.set(textEl, { scaleY: 1 });
      }
    }
  }, [isActive, dotRef, svgIRef, liquidDropsRef]);

  // ── Main animation trigger ─────────────────────────────────────
  useEffect(() => {
    if (!isActive || !isMariamReady) return;
    const svg = svgRef.current;
    const svgI = svgIRef.current;
    const svgA2 = svgA2Ref.current;
    const svgM2 = svgM2Ref.current;
    const dot = dotRef.current;
    if (!svg || !svgI || !svgA2 || !svgM2 || !dot) return;

    // ── Restore from cache (dot at rest on ı) ────────────────────
    // animationEverCompleted means the dot animation ran in a previous mount.
    // We MUST recalculate positions from the live DOM here — cachedPositions
    // holds screen coordinates from the *previous* mount and Mariam may have
    // been re-laid out at different dimensions/position since then.
    //
    // We also wait an extra rAF after isMariamReady fires: useMariamSvg calls
    // setIsMariamReady(true) inside a rAF chain, but the SVG tspan rects are
    // only stable after the browser has painted the new SVG dimensions. Without
    // the extra rAF, calculatePositions() reads the tspan rects before the
    // browser has committed the new SVG layout to the screen.
    if (animationEverCompleted) {
      let rafId: number;
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          const svgIEl = svgIRef.current;
          const svgA2El = svgA2Ref.current;
          const svgM2El = svgM2Ref.current;
          const dotEl = dotRef.current;
          if (!svgIEl || !svgA2El || !svgM2El || !dotEl) return;

          const freshPos = calculatePositions(svgIEl, svgA2El, svgM2El);
          setDotAtFinal(dotEl, freshPos);
          gsap.set(dotEl, { opacity: 0, filter: "blur(15px)" });
          gsap.to(dotEl, {
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.6,
            ease: "power2.out",
          });
          colorLetters(svgIEl, svgA2El, svgM2El);
          setIsDotComplete(true);
          setIsDotFallenFromM(true);
          setIsDotStarted(true);
        });
      });
      return () => cancelAnimationFrame(rafId);
    }

    // ── Wait for user click ─────────────────────────────────────
    if (!shouldAnimate) return;

    // ── Calculate fresh positions ────────────────────────────────
    const pos = calculatePositions(svgI, svgA2, svgM2);
    // ── Mobile: dot hidden, complete; user clicks O to trigger portfolio ──
    if (isMobile) {
      const tid = setTimeout(() => {
        colorLetters(svgI, svgA2, svgM2);

        // Mimic the desktop "ı letter touch" squash/spring so the SVG layout
        // (and thus engineer positioning) matches what happens after the dot lands.
        gsap.to(svgI, { fill: COLORS.accent, duration: 0.28, ease: "sine.out" });
        const textEl = svgI.parentElement as SVGTextElement | null;
        if (textEl) {
          const textR = textEl.getBoundingClientRect();
          const iR = svgI.getBoundingClientRect();
          const originX = iR.left - textR.left + iR.width / 2;
          const originY = iR.bottom - textR.top;
          gsap.set(textEl, { transformOrigin: `${originX}px ${originY}px` });
          gsap.to(textEl, {
            scaleY: 0.88,
            duration: TIMING.letterTouchSquash,
            ease: "sine.in",
            force3D: false,
          });
          gsap.to(textEl, {
            scaleY: 1,
            duration: TIMING.letterTouchSpring,
            ease: "back.out(1.08)",
            delay: TIMING.letterTouchSquash,
            force3D: false,
          });
        }

        Object.assign(dot.style, { display: "none", opacity: "0", visibility: "hidden" });
        setIsDotComplete(true);
        setIsDotFallenFromM(true);
        setIsDotStarted(true);
        animationEverCompleted = true;
      }, 0);
      return () => clearTimeout(tid);
    }

    // ── Desktop: play animation ──────────────────────────────────
    // If the dot is already visible (pre-shown as click target), skip
    // the intro hold/wiggle and blur — jump straight into the action.
    const dotAlreadyVisible =
      dot.style.display === "block" && parseFloat(dot.style.opacity || "0") > 0;
    const startDelay = dotAlreadyVisible ? 0 : 200;

    let activeTl: gsap.core.Timeline | null = null;

    const tid = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          activeTl = buildDotTimeline(
            dot,
            pos,
            { svgI, svgA2, svgM2 },
            {
              onComplete: () => setIsDotComplete(true),
              onDotFallenFromM: () => setIsDotFallenFromM(true),
              onDotLandedOnI,
            },
            dotAlreadyVisible,
          );
          if (!dotAlreadyVisible) {
            gsap.set(dot, { opacity: 0, filter: "blur(15px)" });
            gsap.to(dot, {
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.8,
              ease: "power2.out",
            });
          }
          activeTl.play();
          setIsDotStarted(true);
        });
      });
    }, startDelay);

    return () => {
      clearTimeout(tid);
      if (activeTl) {
        activeTl.kill();
        activeTl = null;
      }
    };
  }, [isActive, isMariamReady, isMobile, shouldAnimate, svgRef, svgIRef, svgA2Ref, svgM2Ref, dotRef, liquidDropsRef, onDotLandedOnI]);

  // ── Resize handler — recalculate positions after Mariam re-layouts ──
  useEffect(() => {
    if (!isActive || !isMariamReady) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      // Wait for Mariam's full layout cycle:
      //   - useMariamSvg debounces at 150ms
      //   - layoutMariam retries up to 12 rAF frames (~200ms at 60fps)
      //   - plus one more paint cycle for tspan rects to stabilise
      // 600ms is conservative but reliable across all device speeds.
      resizeTimer = setTimeout(() => {
        if (animationEverCompleted) {
          const svgIEl = svgIRef.current;
          const svgA2El = svgA2Ref.current;
          const svgM2El = svgM2Ref.current;
          const dotEl = dotRef.current;
          if (!svgIEl || !svgA2El || !svgM2El || !dotEl) return;

          requestAnimationFrame(() => requestAnimationFrame(() => {
            const svgIEl2 = svgIRef.current;
            const svgA2El2 = svgA2Ref.current;
            const svgM2El2 = svgM2Ref.current;
            const dotEl2 = dotRef.current;
            if (!svgIEl2 || !svgA2El2 || !svgM2El2 || !dotEl2) return;

            const pos = calculatePositions(svgIEl2, svgA2El2, svgM2El2);
            setDotAtFinal(dotEl2, pos);
            // Restore "iam" accent colors in case they were cleared on mobile
            colorLetters(svgIEl2, svgA2El2, svgM2El2);
          }));
        }
      }, 600);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [isActive, isMariamReady, svgIRef, svgA2Ref, svgM2Ref, dotRef]);

  return { isDotAnimationStarted: isDotStarted, isDotAnimationComplete: isDotComplete, isDotFallenFromM };
}
