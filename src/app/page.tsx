"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
// Keep portfolio cache in page chunk so it survives Hero unmount (production chunk loading)
import { portfolioCache } from "@/components/hero/portfolioCache";
import Hero from "@/components/hero/hero";
import AppWindowLayout from "@/components/hero/AppWindowLayout";
import { resetMariamCache } from "@/components/hero/hooks/useMariamSvg";
import { gsap } from "gsap";
import GalleryShowcase from "@/components/projects/projects";
import { Certificates, CERTIFICATE_IMAGE_URLS } from "@/components/Certificates";
import { COLORS } from "@/components/hero/constants";
import type { SectionId } from "@/components/hero/types";

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHeroReady, setIsHeroReady] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroInitRef = useRef(false);

  // Preload certificate images in the background so they’re ready when the user opens the section
  useEffect(() => {
    CERTIFICATE_IMAGE_URLS.forEach((src) => {
      const img = new Image();
      img.src = encodeURI(src);
    });
  }, []);

  const handleHeroReady = useCallback(() => {
    setIsHeroReady(true);
    if (!heroRef.current) return;

    const isReturn = heroInitRef.current;
    heroInitRef.current = true;

    // Kill any lingering tweens to prevent conflicts
    gsap.killTweensOf(heroRef.current);

    // Animate hero entrance — works for both first load and return.
    // The hero div always mounts at opacity 0, so we animate from there.
    gsap.set(heroRef.current, { opacity: 0, filter: "blur(15px)" });
    gsap.to(heroRef.current, {
      opacity: 1,
      filter: "blur(0px)",
      duration: isReturn ? 0.6 : 0.8,
      ease: "power2.out",
      delay: isReturn ? 0 : 0.2,
      onComplete: () => setIsTransitioning(false),
    });
  }, []);

  const handleNavigate = useCallback(async (sectionId: SectionId) => {
    if (isTransitioning || activeSection === sectionId) return;
    
    // When leaving hero: mark "expand portfolio when they come back" (page sets it so it works even if Hero chunk unloads on Vercel)
    if (activeSection === "hero" && sectionId !== "hero") {
      portfolioCache.expandOnReturnToHero = true;
      const dots = document.querySelectorAll('.original-i-dot, .final-i-dot, .original-i-dot-svg, .final-i-dot-svg, .original-i-dot-se, .final-i-dot-se');
      dots.forEach((dot) => {
        const htmlDot = dot as HTMLElement;
        if (htmlDot) {
          gsap.killTweensOf(htmlDot);
          htmlDot.style.setProperty('display', 'none', 'important');
          htmlDot.style.setProperty('opacity', '0', 'important');
          htmlDot.style.setProperty('visibility', 'hidden', 'important');
          htmlDot.style.setProperty('z-index', '-1', 'important');
        }
      });
    }
    
    setIsTransitioning(true);
    const tl = gsap.timeline();

    if (sectionId === "hero") {
      // User clicked "home": tell Hero to expand portfolio when it mounts (see portfolioCache / usePortfolioAnimation restore branch).
      portfolioCache.expandOnReturnToHero = true;
      // Always force a fresh Mariam measurement on return to home.
      // Production remount timing can make cached SVG geometry stale.
      resetMariamCache();
      // Hero mounts at opacity 0; handleHeroReady runs blur-to-clear. setIsTransitioning(false) in its onComplete.
      tl.to(`.content-section.active`, {
        opacity: 0,
        x: 100,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setActiveSection("hero");
        }
      });

    } else if (activeSection === "hero") {
      // First navigation away from hero - same blur effect as hero/preloader
      // Set section to active first so it becomes visible
      setActiveSection(sectionId);
      
      // Use double requestAnimationFrame to ensure the section is fully rendered before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const targetSection = document.getElementById(`${sectionId}-content`);
          if (targetSection) {
            // Set initial blur state - same as hero
            gsap.set(targetSection, {
              opacity: 0,
              x: 0,
              filter: "blur(15px)",
              display: "block",
              clearProps: "transform" // Clear any transform that might interfere
            });
            
            // Animate blur out
            gsap.to(targetSection, {
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
              duration: 0.8,
              ease: "power2.out",
              delay: 0.2, // Same delay as hero
              onComplete: () => {
                setIsTransitioning(false);
                // Focus the section so scroll events route to it immediately
                targetSection?.focus({ preventScroll: true });
              }
            });
          } else {
            setIsTransitioning(false);
          }
        });
      });

    } else {
      // Switching between non-hero sections - same blur effect as hero/preloader
      tl.to(`.content-section.active`, {
        opacity: 0,
        x: 100,
        duration: 0.4,
        ease: "power2.in"
      });

      const targetSection = document.getElementById(`${sectionId}-content`);
      if (targetSection) {
        // Set initial blur state - same as hero
        gsap.set(targetSection, {
          opacity: 0,
          x: 0,
          filter: "blur(15px)"
        });
      }

      tl.to(`#${sectionId}-content`, {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power2.out",
        delay: 0.2, // Same delay as hero
        onStart: () => {
          setActiveSection(sectionId);
        },
        onComplete: () => {
          setIsTransitioning(false);
          // Focus the section so scroll events route to it immediately
          const section = document.getElementById(`${sectionId}-content`);
          section?.focus({ preventScroll: true });
        }
      });
    }

  }, [activeSection, isTransitioning]);

  return (
    <div className="portfolio-frame">
      {/* HERO SECTION - Full screen when active, with cinematic blur entrance */}
      {activeSection === "hero" && (
        <div 
          ref={heroRef}
          style={{ 
            opacity: 0,
            visibility: isHeroReady ? 'visible' : 'hidden'
          }}
        >
          <Hero 
            onNavigate={(section: string) => handleNavigate(section as SectionId)}
            onReady={handleHeroReady}
            isActive={activeSection === "hero" && isHeroReady}
            portfolioCache={portfolioCache}
          />
        </div>
      )}

      {/* CONTENT SECTIONS - Same hero app window (title bar + menu), section content in main area */}
      {activeSection !== "hero" && (
        <AppWindowLayout activeSection={activeSection} onNavigate={(section: string) => handleNavigate(section as SectionId)}>
          <div className="content-container app-window-sections" ref={contentRef}>
            {/* Work Section */}
            <section 
              id="work-content" 
              tabIndex={-1}
              className={`content-section ${activeSection === "work" ? "active" : ""}`}
            >
              <GalleryShowcase />
            </section>

            {/* Certificates Section */}
            <section
              id="certificates-content"
              tabIndex={-1}
              className={`content-section ${activeSection === "certificates" ? "active" : ""}`}
            >
              <Certificates isActive={activeSection === "certificates"} />
            </section>
          </div>
        </AppWindowLayout>
      )}


      <style jsx>{`
        .portfolio-frame {
          height: 100vh;
          height: 100dvh;
          position: relative;
          overflow: hidden;
          /* Page background behind the app window chrome */
          background: #EDE6D9;
          margin: 0;
          padding: 0;
        }

        /* Content Container — same program, full viewport */
        .content-container {
          position: absolute;
          inset: 0;
          z-index: 2;
        }

        /* Content Sections — match hero so nav feels like opening a new tab in same app */
        .content-section {
          background-color: ${COLORS.heroBackground};
          position: absolute;
          inset: 0;
          min-height: 100vh;
          min-height: 100dvh;
          opacity: 0;
          transform: translateX(100px);
          display: none;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0;
          margin: 0;
          filter: blur(15px); /* Initial blur state - same as hero/preloader */
          outline: none; /* Hide focus ring when programmatically focused */
        }
        .content-section::-webkit-scrollbar {
          display: none;
        }

        .content-section.active {
          display: block;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0;
          margin: 0;
          /* Opacity, transform, and filter are controlled by GSAP animations */
        }
        .content-section.active::-webkit-scrollbar {
          display: none;
        }

        /* Inside app window: no scrollbar, only remaining view height, center section content */
        .app-window-sections .content-section {
          min-height: 0;
          height: 100%;
        }
        /* Section fills content area so programme body connects to menu bar */
        .app-window-sections .content-section.active {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          overflow: hidden;
        }
        .app-window-sections .content-section.active > * {
          flex: 1;
          min-height: 0;
          max-width: none;
        }

        /* Certificates & projects — full viewport, no extra padding */
        #certificates-content,
        #work-content {
          padding: 0 !important;
          margin: 0 !important;
        }

      `}</style>
    </div>
  );
}