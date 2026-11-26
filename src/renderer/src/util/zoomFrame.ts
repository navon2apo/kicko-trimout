import type { ZoomRect } from '../types';

/** The smallest the frame can get (a sixth of the picture) */
export const MIN_FRAME_SIZE = 1 / 6;

export type FrameHandle = 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The frame after the person drags one of its handles by (dx, dy), given as fractions of the picture.
 * The frame always keeps the shape of the picture and stays inside it:
 * - move: the whole frame moves
 * - a corner: the opposite corner stays where it is
 * - the middle of a side: the opposite side stays, and the frame stays centered along the side that was pulled
 */
export function dragZoomFrame(r: ZoomRect, handle: FrameHandle, dx: number, dy: number): ZoomRect {
  if (handle === 'move') return { ...r, x: clamp(r.x + dx, 0, 1 - r.w), y: clamp(r.y + dy, 0, 1 - r.h) };

  if (handle === 'l' || handle === 'r' || handle === 't' || handle === 'b') {
    const horizontal = handle === 'l' || handle === 'r';
    const fixed = handle === 'l' ? r.x + r.w : handle === 'r' ? r.x : handle === 't' ? r.y + r.h : r.y;
    const raw = handle === 'r' ? r.w + dx : handle === 'l' ? r.w - dx : handle === 'b' ? r.h + dy : r.h - dy;
    const room = handle === 'l' || handle === 't' ? fixed : 1 - fixed;
    const size = clamp(raw, MIN_FRAME_SIZE, Math.min(room, 1));
    if (horizontal) {
      const x = handle === 'l' ? fixed - size : fixed;
      return { x, y: clamp(r.y + r.h / 2 - size / 2, 0, 1 - size), w: size, h: size };
    }
    const y = handle === 't' ? fixed - size : fixed;
    return { x: clamp(r.x + r.w / 2 - size / 2, 0, 1 - size), y, w: size, h: size };
  }

  // A corner: the opposite corner stays put
  const left = handle === 'tl' || handle === 'bl';
  const top = handle === 'tl' || handle === 'tr';
  const fixedX = left ? r.x + r.w : r.x;
  const fixedY = top ? r.y + r.h : r.y;
  const movingX = (left ? r.x : r.x + r.w) + dx;
  const movingY = (top ? r.y : r.y + r.h) + dy;
  const maxW = left ? fixedX : 1 - fixedX;
  const maxH = top ? fixedY : 1 - fixedY;
  const size = clamp(Math.max(Math.abs(movingX - fixedX), Math.abs(movingY - fixedY)), MIN_FRAME_SIZE, Math.min(maxW, maxH, 1));
  return { x: left ? fixedX - size : fixedX, y: top ? fixedY - size : fixedY, w: size, h: size };
}
