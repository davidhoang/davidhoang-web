/**
 * Canonical viewport bands — keep in sync with design.md and variables.css comments.
 * CSS cannot use these in @media; duplicate pixel values in stylesheets.
 */
export const BREAKPOINT_COMPACT_MAX = 480;
export const BREAKPOINT_PHONE_MAX = 767;
export const BREAKPOINT_TABLET_MIN = 768;
export const BREAKPOINT_TABLET_MAX = 1024;

export const MQ_PHONE_MAX = `(max-width: ${BREAKPOINT_PHONE_MAX}px)` as const;
