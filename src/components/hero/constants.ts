/** Design tokens for the hero section */

// ── Colors (Carmine #91010F — single source for accent and dot) ────
export const COLORS = {
  primary: "#280B0B",
  /** Carmine — "iam" letters, dot, O hover/focus, all accent UI */
  accent: "#E62A34",
  heroBackground: "#F9E7C9",
  /** Dot animation variants (derived from accent so one change updates all) */
  dotMotion: "#EF4A52",   // slightly lighter during arcs
  dotLand: "#B81826",     // darker on impact
  dotGhost: "#F9D6D8",    // very light when falling off
  dotFallLight: "#F29AA0", // light when dropping from above
} as const;

// ── Font families ───────────────────────────────────────────────────
export const FONTS = {
  display: '"Momo Trust Display", "Stack Sans", sans-serif',
} as const;

// ── Z-index layering ────────────────────────────────────────────────
// Single source of truth — never set z-index in JS imperatively.
export const Z_LAYERS = {
  dot: 100,
  frame: 200,
  mariamSvg: 300,
  engineerText: 9999,
  /** Mobile sidebar overlay — above Mariam and engineer text when open */
  mobileMenuOverlay: 10000,
} as const;

// ── Animation durations (seconds) ───────────────────────────────────
// NOTE: dotTouchImpact (0.04s) and letterTouchSquash (0.08s) are intentionally
// very short — on 60 Hz that's ~2–5 frames. On 30 fps low-power devices these
// may be imperceptible, but the visual result is still correct because GSAP
// snaps to the end state when the frame budget is exceeded.
export const TIMING = {
  dotFall: 0.4,
  /** Touch moment: impact when dot meets "ı" then settle with overshoot */
  dotTouchImpact: 0.04,
  dotTouchSettle: 0.26,
  letterTouchSquash: 0.08,
  letterTouchSpring: 0.4,
} as const;

// ── Engineer text layout constants ──────────────────────────────────
export const ENGINEER_TEXT = {
  /**
   * Pixels to shift "Software Engineer" downward from the computed top edge
   * of the "ı" dot. Compensates for the visual gap between the SVG baseline
   * and the actual rendered top of the descender-adjusted text block.
   * Derived empirically from the Pouities font metrics at all tested sizes.
   */
  VERTICAL_NUDGE_PX: 50,
} as const;

// ── Breakpoints (px) ───────────────────────────────────────────────
export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
} as const;
