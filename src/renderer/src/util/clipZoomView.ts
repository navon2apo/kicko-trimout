/**
 * What the picture should do right now, for the clip that is selected:
 * - apply: the playhead is inside a clip that has a zoom, so show that zoom
 * - reset: the playhead left the zoomed clip (or the clip lost its zoom): back to the whole picture
 * - leave: nothing from a clip zoom is on screen, so do not touch it (the person may have zoomed by hand)
 */
export function clipZoomDecision({ hasZoom, insideClip, zoomWasApplied }: {
  hasZoom: boolean,
  insideClip: boolean,
  /** A clip zoom was put on the screen earlier and is still there */
  zoomWasApplied: boolean,
}): 'apply' | 'reset' | 'leave' {
  if (hasZoom && insideClip) return 'apply';
  return zoomWasApplied ? 'reset' : 'leave';
}
