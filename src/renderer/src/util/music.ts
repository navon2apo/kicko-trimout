/** Music settings for the merged video. The mixing itself is done by the Pro plugin. */

export type MusicMode = 'replace' | 'mix';

export const MUSIC_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'opus'];
export const DEFAULT_MUSIC_VOLUME = 60;
export const DEFAULT_MUSIC_MODE: MusicMode = 'mix';

export const isMusicMode = (value: unknown): value is MusicMode => value === 'replace' || value === 'mix';

/** The volume setting (0-100) kept to a sensible number */
export const cleanMusicVolume = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : DEFAULT_MUSIC_VOLUME);
