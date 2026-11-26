// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, expect, it } from 'vitest';

import { clipZoomDecision } from './clipZoomView';

describe('what the picture does while it plays', () => {
  it('follows the zoom of the clip while the playhead is inside it', () => {
    expect(clipZoomDecision({ hasZoom: true, insideClip: true, zoomWasApplied: false })).toBe('apply');
    expect(clipZoomDecision({ hasZoom: true, insideClip: true, zoomWasApplied: true })).toBe('apply');
  });

  it('goes back to the whole picture once the playhead leaves the zoomed clip', () => {
    expect(clipZoomDecision({ hasZoom: true, insideClip: false, zoomWasApplied: true })).toBe('reset');
  });

  it('does not touch a picture the person zoomed by hand, because no clip zoom was applied', () => {
    expect(clipZoomDecision({ hasZoom: true, insideClip: false, zoomWasApplied: false })).toBe('leave');
    expect(clipZoomDecision({ hasZoom: false, insideClip: true, zoomWasApplied: false })).toBe('leave');
    expect(clipZoomDecision({ hasZoom: false, insideClip: false, zoomWasApplied: false })).toBe('leave');
  });

  it('resets too when the clip lost its zoom', () => {
    expect(clipZoomDecision({ hasZoom: false, insideClip: true, zoomWasApplied: true })).toBe('reset');
  });
});
