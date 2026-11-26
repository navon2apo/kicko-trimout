/**
 * The player lock and the music for the merged video are made by the Pro plugin, a separate program the app
 * starts. This file only describes the job (what to do, with which numbers) and waits for the answer.
 */
import type { SpotMark } from '../types';
import type { LockSoundId } from './playerLock';
import type { MusicMode } from './music';

export const PRO_PLUGIN_MISSING = 'The Pro plugin is not installed. Install it from "Pro plugin" in the side panel to use this.';

export type PluginJob = Record<string, unknown>;

export function buildLockJob({ inPath, outPath, atSec, spot, label, title, color, sound, glide, fps, quality }: {
  inPath: string,
  outPath: string,
  atSec: number,
  spot: SpotMark,
  label: string,
  title: string,
  color: string,
  sound: LockSoundId,
  /** False when the clip has its own zoom, so the picture does not glide closer on top of it */
  glide: boolean,
  fps: number,
  /** The encoder settings of the chosen quality (the app's own presets) */
  quality: { crf: number, preset: string },
}): PluginJob {
  return {
    job: 'lock', inPath, outPath, atSec, spot: { x: spot.x, y: spot.y, size: spot.size }, label, title, color, sound, glide, fps, crf: quality.crf, preset: quality.preset,
  };
}

export function buildMusicJob({ videoPath, outPath, musicPath, volume, mode }: {
  videoPath: string,
  outPath: string,
  musicPath: string,
  volume: number,
  mode: MusicMode,
}): PluginJob {
  return { job: 'music', videoPath, outPath, musicPath, volume, mode };
}

type Listener = (event: unknown, value: number) => void;
interface Ipc {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>,
  on: (channel: string, listener: Listener) => void,
  removeListener: (channel: string, listener: Listener) => void,
}
const ipc = () => (window as unknown as { require: (name: string) => { ipcRenderer: Ipc } }).require('electron').ipcRenderer;

export async function isProPluginInstalled(): Promise<boolean> {
  try {
    return ((await ipc().invoke('pluginStatus')) as { installed: boolean }).installed;
  } catch {
    return false;
  }
}

/** Runs a job in the plugin and gives back the file it made. Throws with a plain message when it cannot. */
export async function runProJob(job: PluginJob, onProgress?: (percent: number) => void): Promise<string> {
  const listener: Listener = (_event, percent) => onProgress?.(percent);
  ipc().on('pluginJobProgress', listener);
  try {
    const answer = (await ipc().invoke('pluginRun', job)) as { ok: true, outPath: string } | { ok: false, reason: string, message: string };
    if (answer.ok) return answer.outPath;
    throw new Error(answer.reason === 'plugin_missing' ? PRO_PLUGIN_MISSING : answer.message);
  } finally {
    ipc().removeListener('pluginJobProgress', listener);
  }
}
