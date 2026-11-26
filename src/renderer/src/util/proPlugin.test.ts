// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, expect, it } from 'vitest';

import { buildLockJob, buildMusicJob, PRO_PLUGIN_MISSING } from './proPlugin';

describe('jobs for the Pro plugin', () => {
  it('describes a player lock job with the quality of the chosen preset', () => {
    const job = buildLockJob({
      inPath: 'a.mp4', outPath: 'b.mp4', atSec: 4.2, spot: { t: 9, x: 0.5, y: 0.4, size: 0.08 },
      label: 'Dean', title: 'Dribble', color: '#d2ff00', sound: 'blips', glide: true, fps: 30, quality: { crf: 23, preset: 'medium' },
    });
    expect(job).toEqual({
      job: 'lock', inPath: 'a.mp4', outPath: 'b.mp4', atSec: 4.2, spot: { x: 0.5, y: 0.4, size: 0.08 },
      label: 'Dean', title: 'Dribble', color: '#d2ff00', sound: 'blips', glide: true, fps: 30, crf: 23, preset: 'medium',
    });
  });

  it('does not send the spot time, which is only the app\'s own bookkeeping', () => {
    const job = buildLockJob({
      inPath: 'a.mp4', outPath: 'b.mp4', atSec: 1, spot: { t: 99, x: 0.1, y: 0.2, size: 0.05 },
      label: '', title: '', color: '#ffffff', sound: 'off', glide: false, fps: 25, quality: { crf: 18, preset: 'slow' },
    });
    expect(job['spot']).toEqual({ x: 0.1, y: 0.2, size: 0.05 });
    expect(job['crf']).toBe(18);
    expect(job['glide']).toBe(false);
  });

  it('describes a music job', () => {
    expect(buildMusicJob({ videoPath: 'v.mp4', outPath: 'o.mp4', musicPath: 'm.mp3', volume: 60, mode: 'mix' }))
      .toEqual({ job: 'music', videoPath: 'v.mp4', outPath: 'o.mp4', musicPath: 'm.mp3', volume: 60, mode: 'mix' });
  });

  it('has one message for the case that the plugin is not installed', () => {
    expect(PRO_PLUGIN_MISSING).toMatch(/Pro plugin/);
  });
});
