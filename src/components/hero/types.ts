/** Shared interfaces for the hero section */

export interface HeroProps {
  onNavigate: (section: string) => void;
  onReady?: () => void;
  isActive?: boolean;
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
