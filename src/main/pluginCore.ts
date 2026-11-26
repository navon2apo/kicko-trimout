/**
 * The app and the Pro plugin are two separate programs. The app only writes a job file, starts the plugin
 * as its own process, and reads the lines it prints. Nothing from the plugin is loaded into the app.
 */
import { isAbsolute, join, resolve } from 'node:path';

export type PluginMessage =
  | { type: 'progress'; percent: number }
  | { type: 'done'; outPath: string }
  | { type: 'error'; message: string; code?: string; reason?: string };

export function parsePluginLine(line: string): PluginMessage | null {
  const text = line.trim();
  if (!text.startsWith('{')) return null;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (data['type'] === 'progress' && typeof data['percent'] === 'number') return { type: 'progress', percent: data['percent'] };
  if (data['type'] === 'done' && typeof data['outPath'] === 'string') return { type: 'done', outPath: data['outPath'] };
  if (data['type'] === 'error' && typeof data['message'] === 'string') {
    const message: PluginMessage = { type: 'error', message: data['message'] };
    if (typeof data['code'] === 'string') message.code = data['code'];
    if (typeof data['reason'] === 'string') message.reason = data['reason'];
    return message;
  }
  return null;
}

export function buildPluginCommand({ execPath, pluginDir, jobFile, baseEnv }: {
  execPath: string;
  pluginDir: string;
  jobFile: string;
  baseEnv: NodeJS.ProcessEnv;
}) {
  return {
    command: execPath,
    // The app's own program can run plain JavaScript files when asked to; that way no second Node has to be shipped
    args: [join(pluginDir, 'plugin.mjs'), 'run', jobFile],
    env: { ...baseEnv, ELECTRON_RUN_AS_NODE: '1' } as NodeJS.ProcessEnv,
    cwd: pluginDir,
  };
}

/** Returns the key without spaces, or null when it cannot be a real key. */
export function tidyLicenseKey(text: string): string | null {
  const key = text.trim();
  return key.length >= 8 ? key : null;
}

const FAILURE_TEXT: Record<string, string> = {
  unknown_key: 'This license key was not recognized. Check it in your purchase email and try again.',
  not_pro: 'This key belongs to TrimOut without Pro. You can upgrade to Pro and pay only the difference.',
  revoked: 'This purchase was refunded or disputed, so the plugin cannot be used.',
  too_many_devices: 'This key was already used on the most computers it allows.',
  service_unavailable: 'Could not reach the license server. Check your internet connection and try again.',
  offline_expired: 'Could not reach the license server. Check your internet connection and try again.',
  plugin_unavailable: 'The plugin file is not available right now. Try again in a little while.',
};

export function explainPluginFailure(reason: string): string {
  return FAILURE_TEXT[reason] ?? 'Something went wrong. Try again, and contact support if it keeps happening.';
}

/** The plugin runs from its own folder, so a tool path that is relative to the app (as in development) must be made absolute first. */
export function absoluteToolPath(toolPath: string, base: string): string {
  return isAbsolute(toolPath) ? toolPath : resolve(base, toolPath);
}
