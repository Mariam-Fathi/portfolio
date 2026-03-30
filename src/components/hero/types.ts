/** Shared interfaces for the hero section */

/** Cache shape passed from page so Hero uses the same instance in production (avoids duplicate chunk copy on Vercel). */
export interface PortfolioCacheRef {
  expandOnReturnToHero: boolean;
  cachedData: PortfolioData | null;
  dataCalculated: boolean;
  everCompleted: boolean;
  lastExpandedWhenLeavingHero: boolean;
}

export interface HeroProps {
  onNavigate: (section: string) => void;
  onReady?: () => void;
  isActive?: boolean;
  /** Pass page's cache so Hero chunk uses same instance in production (fixes restore-on-return on Vercel). */
  portfolioCache?: PortfolioCacheRef;
}

export interface DotPositions {
  iScreenX: number;
  iScreenY: number;
  iCenterY: number;
  a2ScreenX: number;
  a2ScreenY: number;
  m2ScreenX: number;
  m2ScreenY: number;
  dotSize: number;
  finalDotSize: number;
  /** Portfolio header "O" position for exact dot landing (desktop) */
  oPortfolioScreenX?: number;
  oPortfolioCenterY?: number;
  oPortfolioWidth?: number;
  oPortfolioHeight?: number;
  oPortfolioTop?: number;
}

export interface PortfolioData {
  portfolWidth: number;
  oFinalX: number;
  lineFinalWidth: number;
  iOriginalPosition: number;
  oStartX: number;
  iWidth: number;
  containerWidth: number;
}

export interface MariamSvgData {
  fontSize: number;
  mariamWidth: number;
  mariamHeight: number;
  sidebarOffsetPx: number;
  bottomReservePx: number;
  layoutVersion: number;
  portfolBottom: number;
  portfolLeft: number;
  portfolFontSize: number;
  screenWidth: number;
  screenHeight: number;
}

/** Sections the navigation can target */
export type SectionId =
  | "hero"
  | "work"
  | "certificates";

export const NAV_SECTIONS: { id: SectionId; label: string }[] = [
  { id: "hero", label: "home" },
  { id: "work", label: "projects" },
  { id: "certificates", label: "certificates" },
];
