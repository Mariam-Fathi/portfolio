"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import localFont from "next/font/local";
import gsap from "gsap";
import { COLORS, FONTS, Z_LAYERS } from "./constants";

const pouitiesFont = localFont({
  src: "../../../public/fonts/pouities/Pouities.ttf",
  display: "swap",
});

import { NAV_SECTIONS, type HeroProps } from "./types";
import { useIsMobile, checkIsMobile } from "./hooks/useIsMobile";
import { useHeroBreakpoints } from "./hooks/useHeroBreakpoints";
import { useMariamSvg } from "./hooks/useMariamSvg";
import { hasDotAnimationEverCompleted, resetDotCache, useDotAnimation } from "./hooks/useDotAnimation";
import { usePortfolWidth } from "./hooks/usePortfolWidth";
import { useEngineerText } from "./hooks/useEngineerText";
import HeroContactsPanel from "./HeroContactsPanel";
import HeroAboutPanel from "./HeroAboutPanel";

const Hero: React.FC<HeroProps> = ({
  onNavigate,
  onReady,
  isActive = true,
}) => {
  // ── Refs ──────────────────────────────────────────────────────────
  const portfolioHeaderRef = useRef<HTMLDivElement>(null);
  const numberSevenRef = useRef<SVGSVGElement>(null);
  const svgIRef = useRef<SVGTSpanElement>(null);
  const svgA2Ref = useRef<SVGTSpanElement>(null);
  const svgM2Ref = useRef<SVGTSpanElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const liquidDropsRef = useRef<HTMLDivElement>(null);
  const engineerTextRef = useRef<HTMLDivElement>(null);
  const dotClickSvgRef = useRef<SVGSVGElement>(null);
  const dotClickTlRef = useRef<gsap.core.Timeline | null>(null);

  // ── State ─────────────────────────────────────────────────────────
  const [isMounted, setIsMounted] = useState(false);
  const [portfolioRevealReady, setPortfolioRevealReady] = useState(false);
  const [dotLandedOnI, setDotLandedOnI] = useState(false);
  const [isDotClicked, setIsDotClicked] = useState(false);
  const [showDotClickPrompt, setShowDotClickPrompt] = useState(false);
  const [dotClickPos, setDotClickPos] = useState<{ x: number; y: number; size: number } | null>(null);

  const isDotClickedRef = useRef(false);
  const dotPreShownRef = useRef(false);

  const PAGE_BACKGROUND = "#EDE6D9";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prevIsLgRef = useRef<boolean>(false);
  const prevIsLgInitializedRef = useRef<boolean>(false);

  const isMobile = useIsMobile();
  const { isLg, isSm } = useHeroBreakpoints();

  // ── Mount ─────────────────────────────────────────────────────────
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  // Restore dot/engineer state when returning to hero (lg only)
  useEffect(() => {
    if (!isMounted || !isLg) return;
    if (hasDotAnimationEverCompleted()) {
      setIsDotClicked(true);
      setDotLandedOnI(true);
      isDotClickedRef.current = true;
    }
  }, [isMounted, isLg]);

  // Reset dot cache when resizing from mobile → desktop
  useEffect(() => {
    const prevIsLg = prevIsLgRef.current;
    prevIsLgRef.current = isLg;
    const wasInitialized = prevIsLgInitializedRef.current;
    prevIsLgInitializedRef.current = true;

    if (!wasInitialized || !(!prevIsLg && isLg)) return;

    if (!isDotClicked) {
      // ── Dot never clicked: full reset so the user gets the click prompt again ──
      resetDotCache();
      if (svgIRef.current) gsap.set(svgIRef.current, { fill: COLORS.primary });
      if (svgA2Ref.current) gsap.set(svgA2Ref.current, { fill: COLORS.primary });
      if (svgM2Ref.current) gsap.set(svgM2Ref.current, { fill: COLORS.primary });
      setDotLandedOnI(false);
      if (dotRef.current) {
        Object.assign(dotRef.current.style, { display: "none", opacity: "0", visibility: "hidden" });
      }
      dotPreShownRef.current = false;
      isDotClickedRef.current = false;
      setShowDotClickPrompt(false);
    } else {
      // ── Dot was already clicked: restore post-animation state ──
      // useDotAnimation's main effect re-runs when isMariamReady fires
      // (animationEverCompleted=true path) and repositions the dot at the
      // correct "ı" location after the fresh layout. We just keep React
      // state flags consistent so engineerRevealActive stays true.
      setIsDotClicked(true);
      setDotLandedOnI(true);
      isDotClickedRef.current = true;
    }
  }, [isLg, isDotClicked]);

  // sm: skip dot animation, show engineer text immediately
  useEffect(() => {
    if (isSm) setPortfolioRevealReady(true);
  }, [isSm]);

  // ── Core hooks ────────────────────────────────────────────────────
  const portfolWidth = usePortfolWidth(portfolioHeaderRef);

  const { isMariamReady } = useMariamSvg(
    numberSevenRef,
    portfolWidth,
    portfolioHeaderRef,
    isActive,
  );

  const onDotLandedOnI = useCallback(() => {
    setPortfolioRevealReady(true);
    setDotLandedOnI(true);
  }, []);

  const { isDotAnimationComplete } = useDotAnimation(
    numberSevenRef,
    svgIRef,
    svgA2Ref,
    svgM2Ref,
    dotRef,
    liquidDropsRef,
    isActive,
    isMariamReady,
    isMobile,
    isMounted && (isSm ? portfolioRevealReady : isDotClicked),
    onDotLandedOnI,
  );

  const engineerRevealActive =
    isMounted &&
    (isLg
      ? dotLandedOnI || isDotAnimationComplete || hasDotAnimationEverCompleted()
      : isSm
        ? isDotAnimationComplete
        : portfolioRevealReady || isDotAnimationComplete);

  useEngineerText(
    engineerTextRef,
    numberSevenRef,
    svgIRef,
    svgA2Ref,
    svgM2Ref,
    engineerRevealActive,
    isMariamReady,
    isMobile,
  );

  // ── Dot click position ────────────────────────────────────────────
  useEffect(() => {
    if (!isMariamReady || !svgIRef.current) return;
    const updatePos = () => {
      const iRect = svgIRef.current?.getBoundingClientRect();
      if (!iRect || iRect.width === 0 || iRect.height === 0) return;
      const mobile = checkIsMobile();
      const baseDotSize = iRect.height * 0.135;
      setDotClickPos({
        x: iRect.left + iRect.width / 2,
        y: iRect.top + iRect.height * 0.19,
        size: mobile ? baseDotSize * 0.6 : baseDotSize,
      });
    };

    const t1 = setTimeout(() => requestAnimationFrame(updatePos), 50);
    const t2 = setTimeout(updatePos, 300);

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(updatePos)), 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
      if (timer) clearTimeout(timer);
    };
  }, [isMariamReady]);

  // ── Pre-show dot on "ı" before click (lg only) ────────────────────
  useEffect(() => {
    if (!isLg || !isMariamReady || isDotClicked || !dotRef.current || !dotClickPos) return;
    if (hasDotAnimationEverCompleted()) return;

    const dot = dotRef.current;
    const { size, x, y: baseY } = dotClickPos;
    const baseX = x - size / 2;

    Object.assign(dot.style, {
      display: "block",
      visibility: "visible",
      position: "fixed",
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      backgroundColor: COLORS.primary,
      top: "0px",
      left: "0px",
      pointerEvents: "auto",
      cursor: "pointer",
      transformOrigin: "center center",
    });

    if (!dotPreShownRef.current) {
      gsap.set(dot, { x: baseX, y: baseY, opacity: 0, filter: "blur(15px)", rotation: 0, scale: 1 });
      gsap.to(dot, {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.8,
        delay: 0.2,
        ease: "power2.out",
        onComplete: () => { dotPreShownRef.current = true; },
      });
    } else {
      gsap.set(dot, { x: baseX, y: baseY, rotation: 0, scale: 1 });
    }

    const svgI = svgIRef.current;
    let hoverTl: gsap.core.Timeline | null = null;
    const hoverDrop = 8;

    const onEnter = () => {
      if (hoverTl) hoverTl.kill();
      dot.style.transformOrigin = "50% 0%";
      if (svgI) gsap.to(svgI, { fill: COLORS.accent, duration: 0.22, ease: "sine.out" });
      hoverTl = gsap.timeline();
      hoverTl.to(dot, { y: baseY + hoverDrop, scaleX: 0.96, scaleY: 1.08, backgroundColor: COLORS.accent, duration: 0.22, ease: "sine.out" });
    };
    const onLeave = () => {
      if (hoverTl) hoverTl.kill();
      dot.style.transformOrigin = "center center";
      if (svgI) gsap.to(svgI, { fill: COLORS.primary, duration: 0.24, ease: "sine.out" });
      gsap.to(dot, { y: baseY, scaleX: 1, scaleY: 1, backgroundColor: COLORS.primary, duration: 0.24, ease: "sine.out" });
    };

    dot.addEventListener("mouseenter", onEnter);
    dot.addEventListener("mouseleave", onLeave);

    return () => {
      dot.removeEventListener("mouseenter", onEnter);
      dot.removeEventListener("mouseleave", onLeave);
      if (hoverTl) hoverTl.kill();
      if (svgI) gsap.killTweensOf(svgI);
      if (!isDotClickedRef.current && !hasDotAnimationEverCompleted() && !dotPreShownRef.current) {
        Object.assign(dot.style, { display: "none", opacity: "0", visibility: "hidden", pointerEvents: "none", cursor: "default" });
      }
    };
  }, [isLg, isMariamReady, isDotClicked, dotClickPos]);

  // Reset refs on unmount
  useEffect(() => () => {
    isDotClickedRef.current = false;
    dotPreShownRef.current = false;
  }, []);

  // Show click prompt (lg only)
  useEffect(() => {
    if (isLg && isMariamReady && !isDotClicked && isActive && !hasDotAnimationEverCompleted() && dotClickPos) {
      const t = setTimeout(() => setShowDotClickPrompt(true), 100);
      return () => clearTimeout(t);
    }
    if (!isLg || isDotClicked || hasDotAnimationEverCompleted()) setShowDotClickPrompt(false);
  }, [isLg, isMariamReady, isDotClicked, isActive, dotClickPos]);

  // Animate "click!" SVG sway
  useEffect(() => {
    if (!showDotClickPrompt || !dotClickSvgRef.current) return;
    const el = dotClickSvgRef.current;
    gsap.set(el, { rotation: 0, transformOrigin: "50% 100%", opacity: 0, filter: "blur(15px)" });
    gsap.to(el, { opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power2.out" });
    const tl = gsap.timeline({ repeat: -1, yoyo: true, delay: 0.4 });
    dotClickTlRef.current = tl;
    tl.fromTo(el, { rotation: -4 }, { rotation: 4, duration: 1, ease: "sine.inOut" });
    return () => {
      dotClickTlRef.current?.kill();
      gsap.killTweensOf(el);
    };
  }, [showDotClickPrompt]);

  // Handle dot click
  const handleDotClick = useCallback(() => {
    if (isDotClicked) return;
    isDotClickedRef.current = true;
    dotClickTlRef.current?.kill();
    if (dotClickSvgRef.current) gsap.to(dotClickSvgRef.current, { opacity: 0, scale: 0.8, duration: 0.3, ease: "power2.in" });
    if (dotRef.current) Object.assign(dotRef.current.style, { pointerEvents: "none", cursor: "default" });
    setIsDotClicked(true);
    setShowDotClickPrompt(false);
  }, [isDotClicked]);

  // onReady callback
  useEffect(() => {
    if (isMariamReady && onReady) requestAnimationFrame(() => requestAnimationFrame(onReady));
  }, [isMariamReady, onReady]);

  // Lock background scroll only while mobile menu is open
  useEffect(() => {
    if (!isMobile || !isMobileMenuOpen) return;
    const saved = { bodyOverflow: document.body.style.overflow, bodyHeight: document.body.style.height, htmlOverflow: document.documentElement.style.overflow };
    Object.assign(document.body.style, { overflow: "hidden", overflowY: "hidden", height: "100vh", position: "fixed", width: "100%", top: "0", left: "0" });
    Object.assign(document.documentElement.style, { overflow: "hidden", overflowY: "hidden", height: "100vh" });
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    document.addEventListener("wheel", prevent, { passive: false });
    return () => {
      Object.assign(document.body.style, { overflow: saved.bodyOverflow, height: saved.bodyHeight, position: "", width: "", top: "", left: "" });
      document.documentElement.style.overflow = saved.htmlOverflow;
      document.removeEventListener("touchmove", prevent);
      document.removeEventListener("wheel", prevent);
    };
  }, [isMobile, isMobileMenuOpen]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <section id="hero" className="hero-section" style={{ backgroundColor: PAGE_BACKGROUND }}>
      {/* ── Window frame ─────────────────────────────────────────── */}
      <div className="hero-outer-frame">
        <div className={`hero-yellow-frame hero-window${isMobileMenuOpen ? " hero-window-mobile-menu-open" : ""}`}>

          {/* Title bar */}
          <div className="hero-window-title-bar">
            <div className="hero-window-title-inner">
              <div className="hero-cover-header hero-cover-header-in-title-bar">
                <div className="hero-cover-header-line" ref={portfolioHeaderRef}>
                  <span className="hero-cover-title-whole" aria-label="Portfolio">PORTFOLIO</span>
                </div>
              </div>

              <nav className="hero-window-title-nav" aria-label="Site sections">
                <ul className="hero-window-title-nav-links">
                  {NAV_SECTIONS.map((s) => {
                    const isCurrent = s.id === "hero";
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={isCurrent ? "active" : undefined}
                          aria-current={isCurrent ? "page" : undefined}
                          onClick={() => onNavigate(s.id)}
                        >
                          {s.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <button
                type="button"
                className="hero-window-menu-btn"
                aria-label="Open menu"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <span className="hero-window-menu-btn-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="app-window-layout-content">
            <div className="app-window-content-frame">
              <div className="hero-inner-grid">

                {/* Top-right: About me */}
                <div className="hero-about-panel-wrap">
                  <HeroAboutPanel />
                </div>

                {/* Bottom-left: Contacts */}
                <div className="hero-contact-col">
                  <HeroContactsPanel noBottomReserve />
                </div>

                {/* Bottom-right: Mariam — hidden on mobile */}
                {!isMobile && (
                  <div className="hero-mariam-slot">
                    <div className="hero-mariam-svg-wrap">
                      <svg
                        ref={numberSevenRef}
                        className="hero-number-seven"
                        style={{ zIndex: Z_LAYERS.mariamSvg, pointerEvents: "none", margin: 0, padding: 0 }}
                      >
                        <text
                         
                          className="hero-mariam-text"
                          x="0"
                          y="0"
                          fill={COLORS.primary}
                          fontFamily={FONTS.display}
                          textAnchor="start"
                          dominantBaseline="hanging"
                          style={{ letterSpacing: "0" }}
                        >
                          <tspan>M</tspan>
                          <tspan>a</tspan>
                          <tspan>r</tspan>
                          <tspan ref={svgIRef}>ı</tspan>
                          <tspan ref={svgA2Ref}>a</tspan>
                          <tspan ref={svgM2Ref}>m</tspan>
                        </text>
                      </svg>
                    </div>
                  </div>
                )}

                {/* On mobile, render a hidden SVG still needed for dot refs */}
                {isMobile && (
                  <svg
                    ref={numberSevenRef}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1, overflow: "hidden" }}
                    aria-hidden="true"
                  >
                    <text className="hero-mariam-text">
                      <tspan>M</tspan>
                      <tspan>a</tspan>
                      <tspan>r</tspan>
                      <tspan ref={svgIRef}>ı</tspan>
                      <tspan ref={svgA2Ref}>a</tspan>
                      <tspan ref={svgM2Ref}>m</tspan>
                    </text>
                  </svg>
                )}

              </div>
            </div>
          </div>

          {/* Mobile menu overlay (visible only on small screens) */}
          {isMobileMenuOpen && (
            <div
              className="hero-window-mobile-menu-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="hero-window-mobile-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="hero-window-mobile-menu-close"
                  aria-label="Close menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ×
                </button>

                <div className="hero-window-mobile-menu-content">
                  <ul className="hero-window-mobile-menu-links">
                    {NAV_SECTIONS.map((s) => {
                      const isCurrent = s.id === "hero";
                      return (
                        <li key={s.id}>
                          <a
                            href="#"
                            className={isCurrent ? "active" : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              setIsMobileMenuOpen(false);
                              onNavigate(s.id);
                            }}
                          >
                            {s.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Portals ───────────────────────────────────────────────── */}

      {/* Dot overlay */}
      {isMounted && isLg && createPortal(
        <div
          ref={dotRef}
          className="hero-dot-overlay"
          onClick={!isDotClicked && showDotClickPrompt ? handleDotClick : undefined}
          role={!isDotClicked && showDotClickPrompt ? "button" : undefined}
          tabIndex={!isDotClicked && showDotClickPrompt ? 0 : undefined}
          onKeyDown={!isDotClicked && showDotClickPrompt ? (e: React.KeyboardEvent) => { if (e.key === "Enter") handleDotClick(); } : undefined}
          style={{
            position: "fixed", top: 0, left: 0, display: "none",
            zIndex: !isDotClicked && showDotClickPrompt ? Z_LAYERS.frame + 50 : Z_LAYERS.dot,
            pointerEvents: "none",
          }}
        />,
        document.body,
      )}

      {/* Engineer text */}
      {isMounted && createPortal(
        <div
          ref={engineerTextRef}
          className={`hero-engineer-text ${pouitiesFont.className}`}
          style={{
            position: "fixed",
            color: COLORS.primary,
            fontFamily: pouitiesFont.style.fontFamily,
            fontSize: "clamp(2rem, 6vw, 6rem)",
            zIndex: Z_LAYERS.engineerText,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "visible",
          }}
        >
          Software  Engineer
        </div>,
        document.body,
      )}

      {/* "Click!" SVG prompt */}
      {isMounted && isLg && showDotClickPrompt && dotClickPos && !isDotClicked && createPortal(
        <div
          style={{
            position: "fixed",
            left: `${dotClickPos.x}px`,
            top: `${dotClickPos.y + 8}px`,
            transform: "translateX(-50%) translateY(-100%)",
            zIndex: Z_LAYERS.dot + 10,
            pointerEvents: "none",
          }}
        >
          <svg
            ref={dotClickSvgRef}
            viewBox="0 0 100 70"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            style={{ width: "clamp(55px, 7vw, 90px)", height: "auto", display: "block", color: COLORS.primary, opacity: 0, overflow: "visible" }}
          >
            <g>
              <g transform="matrix(1.554,0.136,-0.136,1.554,9.843,38)">
                <g transform="translate(4.016,8)">
                  <path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2" d="M2.016,-6C1.235,-5.932,0.736,-5.403,0.158,-4.91C-0.567,-4.288,-1.054,-3.599,-1.346,-2.694C-1.559,-2.053,-1.76,-1.413,-1.888,-0.748C-2.016,-0.083,-1.986,0.545,-1.973,1.185C-1.949,2.454,-1.486,3.968,-0.409,4.732C-0.153,4.91,0.145,5.021,0.413,5.175C0.657,5.317,0.865,5.514,1.12,5.625C1.284,5.692,1.327,5.723,1.454,5.822C1.582,5.92,1.655,5.982,1.839,6" />
                </g>
                <g transform="translate(4.74,13.192)">
                  <path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2" d="M-2.506,2.443C-2.506,2.443,-2.57,2.451,-2.57,2.451C-1.515,2.31,-0.466,2.249,0.589,2.108L1.696,1.959C1.878,1.935,2.265,1.958,2.396,1.828C2.57,1.656,2.357,0.978,2.328,0.764C2.294,0.508,2.226,0.241,2.24,-0.016C2.255,-0.252,2.281,-0.494,2.276,-0.733C2.268,-1.067,2.274,-1.381,2.229,-1.715C2.196,-1.96,2.164,-2.206,2.13,-2.451" />
                </g>
              </g>
              <g transform="matrix(1.272,-0.27,0.27,1.272,18,27)">
                <g transform="translate(51.831,5.275)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M0.35,-2.47C0.028,-1.519,-0.195,-0.803,-0.175,0.175C-0.167,0.561,-0.183,0.939,-0.175,1.317C-0.167,1.69,-0.35,2.104,-0.211,2.47" /></g>
                <g transform="translate(51.162,12.575)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M0.193,0.304C0.109,0.081,-0.034,-0.13,-0.193,-0.304C-0.157,-0.169,-0.125,-0.029,-0.098,0.11" /></g>
                <g transform="translate(5.635,7.245)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M2.218,-3.88C1.904,-3.8,1.737,-4.134,1.453,-4.226C1.013,-4.373,0.674,-4.214,0.253,-4.146C-0.253,-4.063,-0.709,-4.15,-1.159,-3.84C-1.497,-3.605,-1.784,-3.196,-2.075,-2.905C-2.273,-2.71,-2.471,-2.524,-2.635,-2.301C-2.813,-2.058,-2.964,-1.796,-3.016,-1.497C-3.135,-0.833,-2.651,-0.376,-2.779,0.248C-2.901,0.857,-3.089,1.35,-2.826,1.963C-2.508,2.706,-2.026,2.933,-1.422,3.414C-1.112,3.661,-0.781,3.884,-0.416,4.039C-0.188,4.134,0.169,4.373,0.407,4.341C0.781,4.289,1.151,3.983,1.513,3.864C1.974,3.709,2.679,3.486,3.135,3.438" /></g>
                <g transform="translate(41.164,7.61)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M-0.428,5.047C-0.448,4.12,-0.463,3.19,-0.487,2.263C-0.503,1.655,-0.515,1.106,-0.392,0.505C-0.3,0.056,-0.181,-0.326,-0.181,-0.783C-0.181,-1.487,-0.121,-2.092,0.002,-2.788C0.073,-3.186,0.141,-3.599,0.244,-3.993C0.34,-4.351,0.515,-4.661,0.455,-5.047" /></g>
                <g transform="translate(43.777,6.097)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M-2.153,1.74C-2.027,0.944,-0.944,0.475,-0.371,0.022C-0.017,-0.261,0.403,-0.42,0.741,-0.71C1.191,-1.096,1.616,-1.442,2.153,-1.74C2.137,-1.609,2.066,-1.509,1.931,-1.446" /></g>
                <g transform="translate(43.497,9.02)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M-1.606,-2.253C-1.535,-1.807,-1.293,-1.211,-1.09,-0.801C-0.704,-0.034,-0.004,0.253,0.656,0.666C1.142,0.969,1.363,1.772,1.606,2.253" /></g>
                <g transform="translate(24.172,2.806)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M0.062,0.115L0.062,0.012C0.062,0.095,0.013,0.259,0.141,0.239C0.268,0.219,0.26,-0.004,0.193,-0.072C-0.054,-0.306,-0.268,0.306,0.053,0.167C0.086,0.032,-0.13,0.016,-0.125,0.175" /></g>
                <g transform="translate(24.518,9.215)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M0.093,2.746C0.149,2.535,0.193,2.242,0.157,2.018C0.113,1.745,-0.014,1.565,-0.026,1.283C-0.038,1.036,0.018,0.798,-0.026,0.551C-0.074,0.268,-0.169,0.065,-0.181,-0.224C-0.193,-0.514,-0.161,-0.81,-0.157,-1.099C-0.157,-1.664,0.038,-2.158,0.061,-2.746" /></g>
                <g transform="translate(16.343,7.284)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M-1.579,-4.2C-1.948,-3.929,-1.758,-3.141,-1.833,-2.744C-1.953,-2.119,-2.188,-1.598,-2.195,-0.954C-2.203,-0.318,-2.227,0.322,-2.232,0.959C-2.235,1.468,-2.351,1.846,-2.414,2.343C-2.477,2.839,-2.282,3.373,-2.112,3.85C-1.977,3.695,-1.571,4.161,-1.396,4.149C-0.713,4.109,-0.044,4.097,0.645,4.113C0.982,4.12,1.32,4.124,1.654,4.137C1.921,4.145,2.216,4.2,2.477,4.128" /></g>
                <g transform="translate(32.644,7.785)"><path strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" strokeWidth="2.5" d="M2.663,-3.592C2.642,-3.815,2.105,-3.798,1.954,-3.794C1.791,-3.794,1.628,-3.783,1.465,-3.794C1.27,-3.811,1.091,-3.882,0.9,-3.918C0.168,-4.044,-0.233,-3.656,-0.746,-3.281C-1.295,-2.884,-1.617,-2.431,-1.852,-1.822C-2.051,-1.309,-2.11,-0.76,-2.357,-0.263C-2.428,-0.116,-2.516,0.023,-2.56,0.178C-2.587,0.279,-2.6,0.382,-2.604,0.486C-2.62,0.755,-2.623,1.03,-2.635,1.301C-2.639,1.384,-2.663,1.491,-2.635,1.574C-2.604,1.671,-2.508,1.762,-2.456,1.845C-2.297,2.091,-2.138,2.335,-1.987,2.585C-1.876,2.768,-1.78,2.966,-1.637,3.125C-1.51,3.266,-1.359,3.388,-1.224,3.52C-1.128,3.615,-1.037,3.698,-0.913,3.754C-0.834,3.79,-0.75,3.814,-0.671,3.833C-0.516,3.874,-0.361,3.889,-0.201,3.901C0.141,3.93,0.475,4.044,0.822,4.04C1.107,4.04,1.37,4.029,1.652,3.982" /></g>
              </g>
            </g>
          </svg>
        </div>,
        document.body,
      )}

      {/* ── Styles ────────────────────────────────────────────────── */}
      <style jsx>{`
        .hero-section {
          display: flex;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: ${COLORS.primary};
          position: relative;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }

        .hero-outer-frame {
          position: fixed;
          inset: clamp(8px, 2vw, 18px);
          z-index: ${Z_LAYERS.frame};
          pointer-events: auto;
          border: 2px solid ${COLORS.primary};
          box-shadow: 2px 2px 0 #1a1a1a;
          overflow: hidden;
          background: ${COLORS.heroBackground};
        }

        .hero-yellow-frame {
          position: absolute;
          inset: 0;
          pointer-events: auto;
          z-index: ${Z_LAYERS.frame};
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        .hero-yellow-frame.hero-window-mobile-menu-open { overflow: visible; }

        .hero-window {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          background: ${COLORS.heroBackground};
          position: relative;
          margin: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          --titlebar-square-height: clamp(48px, 6vw, 64px);
        }
        @media (min-width: 768px) {
          .hero-window { --titlebar-square-height: 120px; }
        }

        .hero-window-title-bar {
          flex-shrink: 0;
          background:  #FCB34F;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          height: var(--titlebar-square-height);
          min-height: var(--titlebar-square-height);
          padding: 0 clamp(10px, 3vw, 14px);
          color: ${COLORS.primary};
          border: 2px solid ${COLORS.primary};
          box-shadow: 2px 2px 0 #1a1a1a;
          overflow: visible;
          margin: 0;
        }

        .hero-window-title-inner {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          padding: 0;
        }
        @media (max-width: 768px) {
          .hero-window-title-inner { gap: 0.5rem; }
        }

        .hero-window-title-bar .hero-cover-header.hero-cover-header-in-title-bar {
          position: relative !important;
          inset: auto !important;
          flex: 0 0 auto;
          min-width: 0;
          width: auto;
          height: 100%;
          min-height: var(--titlebar-square-height);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0;
        }
        .hero-window-title-bar .hero-cover-header-line {
          height: 100%;
          min-height: var(--titlebar-square-height);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: auto;
          margin: 0;
          padding: 0;
          position: relative;
          overflow: visible;
        }
        .hero-window-title-bar .hero-cover-title-whole {
          font-size: clamp(24px, calc(var(--titlebar-square-height) * 0.39), 58px);
          letter-spacing: 0.12em;
          height: var(--titlebar-square-height);
          color: ${COLORS.primary};
          font-family: ${FONTS.display};
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          line-height: 1;
          white-space: nowrap;
          transform: translateX(-2px);
        }
        @media (max-width: 768px) {
          .hero-window-title-bar .hero-cover-title-whole {
            font-size: clamp(1.65rem, 6.2vw, 3rem);
            height: clamp(42px, 11vw, 60px);
          }
        }
        /* Nav */
        .hero-window-title-nav {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          min-height: var(--titlebar-square-height);
        }
        .hero-window-title-nav-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          gap: clamp(0.65rem, 1.5vw, 1.1rem);
          white-space: nowrap;
        }
        .hero-window-title-nav-links button {
          color: ${COLORS.primary};
          font-family: ${FONTS.display};
          font-size: clamp(0.72rem, 1.05vw, 0.92rem);
          text-transform: lowercase;
          letter-spacing: 0.06em;
          line-height: 1;
          padding: 0.35rem 0.45rem;
          background: ${COLORS.heroBackground};
          border: 2px solid ${COLORS.primary};
          box-shadow: 2px 2px 0 #1a1a1a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          appearance: none;
        }
        .hero-window-title-nav-links button:hover,
        .hero-window-title-nav-links button.active {
          opacity: 0.95;
          font-weight: 700;
        }
        @media (max-width: 768px) {
          .hero-window-title-nav {
            flex: 0 1 auto;
            max-width: min(52vw, 220px);
            min-width: 0;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .hero-window-title-nav::-webkit-scrollbar { display: none; }
          .hero-window-title-nav-links { display: none; }
          .hero-window-title-nav-links button {
            font-size: clamp(0.62rem, 2vw, 0.78rem);
            padding: 0.3rem 0.15rem;
            white-space: nowrap;
          }
        }

        /* Mobile hamburger menu (replaces the 3 title tabs) */
        .hero-window-menu-btn {
          display: none;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          padding: 0;
          border: none;
          background: transparent;
          color: ${COLORS.primary};
          cursor: pointer;
          border-radius: 6px;
        }
        .hero-window-menu-btn:hover { opacity: 0.9; }
        .hero-window-menu-btn-icon { display: flex; align-items: center; justify-content: center; }
        .hero-window-menu-btn-icon svg { width: 24px; height: 24px; }
        @media (max-width: 768px) {
          .hero-window-menu-btn { display: flex; }
        }

        .hero-window-mobile-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: ${Z_LAYERS.mobileMenuOverlay};
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 0;
        }
        .hero-window-mobile-menu {
          width: min(280px, 85vw);
          height: 100%;
          max-height: 100vh;
          max-height: 100dvh;
          background: ${COLORS.heroBackground};
          color: ${COLORS.primary};
          padding: 1.25rem 1rem;
          box-shadow: -2px 0 12px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow: hidden;
        }
        .hero-window-mobile-menu-close {
          align-self: flex-end;
          width: 44px;
          height: 44px;
          padding: 0;
          border: none;
          background: transparent;
          color: ${COLORS.primary};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-window-mobile-menu-close:hover { opacity: 0.9; }
        .hero-window-mobile-menu-content {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        .hero-window-mobile-menu-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .hero-window-mobile-menu-links a {
          color: ${COLORS.primary};
          text-decoration: none;
          font-family: ${FONTS.display};
          font-size: 1rem;
          text-transform: lowercase;
          letter-spacing: 0.06em;
          padding: 0.6rem 0.5rem;
          display: block;
          opacity: 0.92;
        }
        .hero-window-mobile-menu-links a:hover,
        .hero-window-mobile-menu-links a.active { opacity: 1; font-weight: 700; }

        /* Content frame */
        .app-window-layout-content {
          flex: 1;
          min-height: 0;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: ${COLORS.heroBackground};
        }
        .app-window-content-frame {
          flex: 1;
          min-height: 0;
          background: ${COLORS.heroBackground};
          position: relative;
          overflow: hidden;
          padding: clamp(10px, 2vw, 18px);
          padding-bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          height: 0;
        }

        /* ── Inner grid ──────────────────────────────────────────── */
        .hero-inner-grid {
          width: 100%;
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
          grid-template-rows: auto 1fr;
          grid-template-areas:
            "empty    experience"
            "contacts mariam";
          column-gap: clamp(10px, 2vw, 18px);
          row-gap: 0;
          overflow: hidden;
          align-items: stretch;
          align-content: stretch;
        }

        .hero-about-panel-wrap {
          grid-area: experience;
          justify-self: end;
          align-self: start;
          width: auto;
          max-width: 100%;
          overflow: visible;
          pointer-events: auto;
          position: relative;
          margin-top: clamp(3rem, 1.5vh, 16px);
          margin-right: clamp(0px, 2vw, 18px);
          /* Keep the Experience panel behind Mariam */
          z-index: ${Z_LAYERS.mariamSvg - 1};
        }

        .hero-contact-col {
          grid-area: contacts;
          align-self: stretch;
          justify-self: start;
          overflow: hidden;
          position: relative;
          /* Keep Contacts behind Mariam */
          z-index: ${Z_LAYERS.mariamSvg - 1};
          width: 100%;
          display: flex;
          flex-direction: column;
          padding: 0;
          box-sizing: border-box;
          min-height: 0;
          transform: translateY(-40%);
        }

        .hero-contact-col > * {
          flex: 1;
          min-height: 0;
          width: 100%;
          overflow: hidden;
        }

        .hero-mariam-slot {
          grid-area: mariam;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: flex-end;
          align-self: stretch;
          overflow: visible;
          position: relative;
          z-index: ${Z_LAYERS.mariamSvg + 10};
          min-height: 0;
        }

        .hero-mariam-svg-wrap {
          width: 100%;
          overflow: visible;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          margin: 0;
          padding: 0;
        }

        /* Mobile: single column, no mariam */
        @media (max-width: 768px) {
          .app-window-content-frame {
            height: auto;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 10px;
          }
          .hero-inner-grid {
            display: flex;
            flex-direction: column;
            gap: clamp(8px, 2vw, 14px);
            overflow-y: auto;
            overflow-x: hidden;
            flex: 0 0 auto;
            min-height: 0;
          }
          .hero-contact-col {
            align-self: stretch;
            flex: 0 0 auto;
            min-height: 0;
            padding: 0;
            overflow: visible;
            transform: none;
          }
          .hero-contact-col > * {
            flex: 0 0 auto;
            min-height: 0;
            overflow: visible;
          }
          .hero-about-panel-wrap {
            margin-top: 0;
            flex-shrink: 0;
            width: 100%;
            justify-self: stretch;
            margin-right: 0;
            overflow: visible;
          }
          .hero-mariam-slot { display: none; }
        }

        /* ── Portfolio title elements ─────────────────────────── */
        .hero-cover-header {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          font-family: ${FONTS.display};
          width: 100%;
          padding: 0 1rem;
          z-index: 10;
          pointer-events: auto;
          overflow: visible;
        }
        .hero-cover-header-line {
          display: flex;
          align-items: center;
          width: 100%;
          min-width: 0;
          height: 100%;
          gap: 0;
          position: relative;
          overflow: visible;
        }
        /* ── Engineer text ────────────────────────────────────── */
        :global(.hero-engineer-text) {
          color: ${COLORS.primary};
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          user-select: none;
          z-index: ${Z_LAYERS.engineerText};
          position: fixed;
          overflow: visible;
        }
        @media (max-width: 768px) {
          :global(.hero-engineer-text) { font-size: clamp(1.5rem, 5vw, 3.5rem); }
        }
        @media (max-width: 480px) {
          :global(.hero-engineer-text) { font-size: clamp(1.2rem, 4.5vw, 2.8rem); }
        }

        /* ── Dot overlay ─────────────────────────────────────── */
        :global(.hero-dot-overlay) {
          z-index: ${Z_LAYERS.dot} !important;
          position: fixed !important;
          border-radius: 50%;
          background-color: ${COLORS.accent};
          pointer-events: none;
        }
      `}</style>
    </section>
  );
};

export default Hero;
