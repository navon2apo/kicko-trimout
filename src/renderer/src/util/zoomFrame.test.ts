// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, expect, it } from 'vitest';

import { dragZoomFrame } from './zoomFrame';

const frame = { x: 0.3, y: 0.3, w: 0.4, h: 0.4 };

describe('dragging the zoom frame', () => {
  it('moves the whole frame and keeps it inside the picture', () => {
    const moved = dragZoomFrame(frame, 'move', 0.1, -0.1);
    expect(moved.x).toBeCloseTo(0.4, 6);
    expect(moved.y).toBeCloseTo(0.2, 6);
    expect(moved.w).toBeCloseTo(0.4, 6);
    expect(moved.h).toBeCloseTo(0.4, 6);
    expect(dragZoomFrame(frame, 'move', 5, 5)).toEqual({ x: 0.6, y: 0.6, w: 0.4, h: 0.4 });
    expect(dragZoomFrame(frame, 'move', -5, -5)).toEqual({ x: 0, y: 0, w: 0.4, h: 0.4 });
  });

  it('a corner changes the size and the opposite corner stays', () => {
    const r = dragZoomFrame(frame, 'br', 0.1, 0.1);
    expect(r.x).toBeCloseTo(0.3, 5);
    expect(r.y).toBeCloseTo(0.3, 5);
    expect(r.w).toBeCloseTo(0.5, 5);
    expect(r.h).toBeCloseTo(0.5, 5);
    const t = dragZoomFrame(frame, 'tl', 0.1, 0.1);
    expect(t.x + t.w).toBeCloseTo(0.7, 5);
    expect(t.y + t.h).toBeCloseTo(0.7, 5);
    expect(t.w).toBeCloseTo(0.3, 5);
  });

  it('the middle of a side changes the size too, keeping the opposite side and the middle of the frame', () => {
    const right = dragZoomFrame(frame, 'r', 0.1, 0);
    expect(right.x).toBeCloseTo(0.3, 5);
    expect(right.w).toBeCloseTo(0.5, 5);
    expect(right.y + right.h / 2).toBeCloseTo(0.5, 5);

    const left = dragZoomFrame(frame, 'l', 0.1, 0);
    expect(left.x + left.w).toBeCloseTo(0.7, 5);
    expect(left.w).toBeCloseTo(0.3, 5);
    expect(left.y + left.h / 2).toBeCloseTo(0.5, 5);

    const top = dragZoomFrame(frame, 't', 0, -0.1);
    expect(top.y + top.h).toBeCloseTo(0.7, 5);
    expect(top.h).toBeCloseTo(0.5, 5);
    expect(top.x + top.w / 2).toBeCloseTo(0.5, 5);

    const bottom = dragZoomFrame(frame, 'b', 0, 0.1);
    expect(bottom.y).toBeCloseTo(0.3, 5);
    expect(bottom.h).toBeCloseTo(0.5, 5);
  });

  it('keeps the shape of the picture, never gets too small, and never leaves the picture', () => {
    for (const handle of ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'] as const) {
      for (const [dx, dy] of [[5, 5], [-5, -5], [5, -5], [-5, 5]] as const) {
        const r = dragZoomFrame(frame, handle, dx, dy);
        expect(r.w).toBeCloseTo(r.h, 6);
        expect(r.w).toBeGreaterThanOrEqual(1 / 6 - 1e-9);
        expect(r.x).toBeGreaterThanOrEqual(-1e-9);
        expect(r.y).toBeGreaterThanOrEqual(-1e-9);
        expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9);
        expect(r.y + r.h).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });

  it('a side near the edge of the picture still grows as far as there is room', () => {
    const nearEdge = { x: 0.6, y: 0.1, w: 0.3, h: 0.3 };
    const r = dragZoomFrame(nearEdge, 'r', 0.5, 0);
    expect(r.x + r.w).toBeCloseTo(1, 5);
  });
});
