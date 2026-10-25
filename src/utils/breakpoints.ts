/**
 * Canonical viewport bands — keep in sync with design.md and variables.css comments.
 * CSS cannot use these in @media; duplicate pixel values in stylesheets.
 */
export const BREAKPOINT_COMPACT_MAX = 480;
export const BREAKPOINT_PHONE_MAX = 767;
export const BREAKPOINT_TABLET_MIN = 768;
export const BREAKPOINT_TABLET_MAX = 1024;
export const BREAKPOINT_DESKTOP_MIN = 1025;

export const MQ_PHONE_MAX = `(max-width: ${BREAKPOINT_PHONE_MAX}px)` as const;
export const MQ_TABLET_MIN = `(min-width: ${BREAKPOINT_TABLET_MIN}px)` as const;
export const MQ_TABLET_MAX = `(max-width: ${BREAKPOINT_TABLET_MAX}px)` as const;
export const MQ_DESKTOP_MIN = `(min-width: ${BREAKPOINT_DESKTOP_MIN}px)` as const;
