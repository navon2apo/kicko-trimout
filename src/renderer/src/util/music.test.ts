// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, expect, it } from 'vitest';

import { cleanMusicVolume, DEFAULT_MUSIC_VOLUME, isMusicMode } from './music';

describe('music settings', () => {
  it('keeps the volume setting between 0 and 100', () => {
    expect(cleanMusicVolume(150)).toBe(100);
    expect(cleanMusicVolume(-5)).toBe(0);
    expect(cleanMusicVolume('loud')).toBe(DEFAULT_MUSIC_VOLUME);
  });

  it('knows the two ways to use the music', () => {
    expect(isMusicMode('mix')).toBe(true);
    expect(isMusicMode('replace')).toBe(true);
    expect(isMusicMode('loud')).toBe(false);
  });
});
