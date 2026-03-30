"use client";

import React, { useEffect, useState } from "react";
import { COLORS, FONTS, Z_LAYERS } from "./constants";
import type { SectionId } from "./types";
import { NAV_SECTIONS } from "./types";

export interface AppWindowLayoutProps {
  onNavigate: (section: string) => void;
  activeSection?: SectionId;
  children: React.ReactNode;
}

/**
 * Same app window chrome as hero (outer window + title bar + nav in bar). Use when
 * showing a section so the chrome stays and only the content area is replaced.
 */
export default function AppWindowLayout({ onNavigate, activeSection, children }: AppWindowLayoutProps) {
  const handleNavigate = (section: SectionId) => {
    onNavigate(section);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <>
      <div className="hero-outer-frame">
        <div
          className={`hero-yellow-frame hero-window app-window-layout${
            isMobileMenuOpen ? " hero-window-mobile-menu-open" : ""
          }`}
        >
        {/* Title bar: PORTFOLIO (clickable = back to hero) + nav links */}
        <div className="hero-window-title-bar">
          <div className="hero-window-title-inner">
          <div className="hero-cover-header hero-cover-header-in-title-bar">
            <div
              className="hero-cover-header-line"
              role="button"
              tabIndex={0}
              aria-label="Back to home"
              onClick={() => handleNavigate("hero")}
              onKeyDown={(e) => e.key === "Enter" && handleNavigate("hero")}
              style={{ cursor: "pointer" }}
            >
              <span className="hero-cover-title-whole" aria-label="Portfolio">PORTFOLIO</span>
            </div>
          </div>

          <nav className="hero-window-title-nav" aria-label="Site sections">
            <ul className="hero-window-title-nav-links">
              {NAV_SECTIONS.map((s) => {
                const isCurrent = s.id === activeSection;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={isCurrent ? "active" : undefined}
                      aria-current={isCurrent ? "page" : undefined}
                      onClick={() => handleNavigate(s.id)}
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

        {/* Content frame — no margin/borders, same as hero */}
        <div className="app-window-layout-content">
          <div className="app-window-content-frame">{children}</div>
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
                    const isCurrent = s.id === activeSection;
                    return (
                      <li key={s.id}>
                        <a
                          href="#"
                          className={isCurrent ? "active" : undefined}
                          onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            handleNavigate(s.id);
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

      <style jsx>{`
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
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        .hero-yellow-frame.hero-window-mobile-menu-open {
          overflow: visible;
        }
        .hero-window {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          background: ${COLORS.heroBackground};
          margin: 0;
          overflow: hidden;
          height: 100%;
          /* Title bar is half the desktop sidebar width (md:w-[240px] => 120px). */
          --titlebar-square-height: clamp(48px, 6vw, 64px);
        }
        @media (min-width: 768px) {
          .hero-window {
            --titlebar-square-height: 120px;
          }
        }
        .hero-window-title-bar {
          flex-shrink: 0;
          background: #FCB34F;
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
          overflow: visible;
          border: 2px solid ${COLORS.primary};
          box-shadow: 2px 2px 0 #1a1a1a;
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
          .hero-window-title-inner {
            gap: 0.5rem;
          }
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
        @media (max-width: 768px) {
          .hero-window-title-bar .hero-cover-header.hero-cover-header-in-title-bar {
            justify-content: flex-start;
          }
        }
        .hero-window-title-bar .hero-cover-header-line {
          height: 100%;
          min-height: var(--titlebar-square-height);
          justify-content: flex-start;
          display: flex;
          align-items: center;
          width: auto;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .hero-window-title-bar .hero-cover-header-line {
            justify-content: flex-start;
          }
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
          justify-content: flex-end;
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
          .hero-window-title-nav-links {
            display: none;
          }
          .hero-window-title-nav-links button {
            font-size: clamp(0.66rem, 2.2vw, 0.85rem);
            letter-spacing: 0.055em;
          }
        }
        @media (max-width: 768px) {
          .hero-window-title-nav {
            flex: 0 1 auto;
            max-width: min(52vw, 220px);
            min-width: 0;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-left: 0.5rem;
          }
          .hero-window-title-nav::-webkit-scrollbar {
            display: none;
          }
        }
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

        .app-window-layout-content {
          flex: 1;
          min-height: 0;
          position: relative;
          display: flex;
          overflow: hidden;
          background: ${COLORS.heroBackground};
        }
        .app-window-content-frame {
          flex: 1;
          min-height: 0;
          margin: 0;
          background: ${COLORS.heroBackground};
          position: relative;
          overflow: hidden;
          padding: clamp(10px, 2vw, 18px);
          padding-bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
      `}</style>
    </>
  );
}
