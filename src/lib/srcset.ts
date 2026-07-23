// Pure, isomorphic helpers shared between the (server-only) sharp pipeline and
// the (client) Gallery island - no fs/sharp/env imports here on purpose.

export const THUMBNAIL_WIDTH = 400;
export const DISPLAY_WIDTH = 1800;
// Extra, smaller display widths generated purely for a responsive srcset -
// the canonical `displayUrl` stays DISPLAY_WIDTH (1800) for non-srcset use.
export const EXTRA_DISPLAY_WIDTHS = [800, 1200];

export function displayVariantFilename(id: string, width: number): string {
  return width === DISPLAY_WIDTH ? `${id}-display.webp` : `${id}-display-${width}.webp`;
}

/** Builds a srcset string for the display image from its canonical (1800w) URL. */
export function getDisplaySrcSet(displayUrl: string): string {
  const filename = displayUrl.split('/').pop() ?? displayUrl;
  const id = filename.replace(/-display\.webp$/, '');
  return [...EXTRA_DISPLAY_WIDTHS, DISPLAY_WIDTH]
    .map((width) => `/uploads/${displayVariantFilename(id, width)} ${width}w`)
    .join(', ');
}
