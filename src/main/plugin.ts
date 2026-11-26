// eslint-disable-next-line import/no-extraneous-dependencies
import { app } from 'electron';
import { execFile, spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import logger from './logger.js';
import { buildPluginCommand, explainPluginFailure, parsePluginLine, tidyLicenseKey } from './pluginCore.js';

const execFileAsync = promisify(execFile);

export const PLUGIN_ID = 'kicko-lock';
/** The license server (a normal domain, since some networks block workers.dev). Can be overridden for testing. */
const LICENSE_SERVER_URL = process.env['TRIMOUT_LICENSE_URL'] ?? 'https://license.kicko.football';

export class PluginError extends Error {
  reason: string;

  constructor(reason: string) {
    super(explainPluginFailure(reason));
    this.name = 'PluginError';
    this.reason = reason;
  }
}

const pluginDir = () => join(app.getPath('userData'), 'plugins', PLUGIN_ID);

export interface PluginStatus {
  installed: boolean;
  version?: string;
  jobs?: string[];
  serverConfigured: boolean;
}

export async function getPluginStatus(): Promise<PluginStatus> {
  const serverConfigured = LICENSE_SERVER_URL !== '';
  try {
    const manifest = JSON.parse(await readFile(join(pluginDir(), 'plugin.json'), 'utf8')) as { version?: string; jobs?: string[] };
    const status: PluginStatus = { installed: true, serverConfigured };
    if (manifest.version) status.version = manifest.version;
    if (manifest.jobs) status.jobs = manifest.jobs;
    return status;
  } catch {
    return { installed: false, serverConfigured };
  }
}

async function downloadPluginZip(key: string, zipPath: string, onProgress: (percent: number) => void) {
  let res: Response;
  try {
    res = await fetch(`${LICENSE_SERVER_URL}/download`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) });
  } catch {
    throw new PluginError('service_unavailable');
  }
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { reason?: string } | null;
    throw new PluginError(res.status >= 500 && !data?.reason ? 'service_unavailable' : (data?.reason ?? 'unknown'));
  }
  const total = Number(res.headers.get('content-length')) || 0;
  let received = 0;
  const source = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
  source.on('data', (chunk: Buffer) => {
    received += chunk.length;
    if (total > 0) onProgress(Math.min(90, Math.round((received / total) * 90)));
  });
  await pipeline(source, createWriteStream(zipPath));
}

/** Downloads the plugin for a valid Pro key, unpacks it next to the app's data, and saves the key for it. */
export async function installPlugin(rawKey: string, onProgress: (percent: number) => void): Promise<PluginStatus> {
  if (!LICENSE_SERVER_URL) throw new PluginError('service_unavailable');
  const key = tidyLicenseKey(rawKey);
  if (!key) throw new PluginError('unknown_key');

  const work = await mkdtemp(join(tmpdir(), 'trimout-plugin-'));
  try {
    const zipPath = join(work, 'plugin.zip');
    await downloadPluginZip(key, zipPath, onProgress);

    const unpacked = join(work, 'unpacked');
    await mkdir(unpacked, { recursive: true });
    // Windows 10 and 11 ship a tar that can open zip files, so nothing extra has to be bundled
    await execFileAsync(join(process.env['SystemRoot'] ?? String.raw`C:\Windows`, 'System32', 'tar.exe'), ['-xf', zipPath, '-C', unpacked]);
    await writeFile(join(unpacked, 'license.json'), JSON.stringify({ key }));
    onProgress(95);

    const target = pluginDir();
    await mkdir(join(target, '..'), { recursive: true });
    await rm(target, { recursive: true, force: true });
    await rename(unpacked, target);
    onProgress(100);
    logger.info('Plugin installed', target);
    return await getPluginStatus();
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Runs one job in the plugin, as its own process. Resolves with the finished file. */
export async function runPluginJob(job: Record<string, unknown>, onProgress: (percent: number) => void): Promise<string> {
  const status = await getPluginStatus();
  if (!status.installed) throw new PluginError('plugin_missing');

  const work = await mkdtemp(join(tmpdir(), 'trimout-job-'));
  try {
    const jobFile = join(work, 'job.json');
    await writeFile(jobFile, JSON.stringify(job));
    const cmd = buildPluginCommand({ execPath: process.execPath, pluginDir: pluginDir(), jobFile, baseEnv: process.env });
    return await new Promise<string>((resolve, reject) => {
      const child = spawn(cmd.command, cmd.args, { env: cmd.env, cwd: cmd.cwd, windowsHide: true });
      let outPath: string | null = null;
      let failure: PluginError | Error | null = null;
      let buffer = '';
      const handleLine = (line: string) => {
        const msg = parsePluginLine(line);
        if (!msg) return;
        if (msg.type === 'progress') onProgress(msg.percent);
        else if (msg.type === 'done') outPath = msg.outPath;
        else failure = msg.code === 'license' ? new PluginError(msg.reason ?? 'unknown') : new Error(msg.message);
      };
      child.stdout.on('data', (data: Buffer) => {
        buffer += data.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) handleLine(line);
      });
      child.stderr.on('data', (data: Buffer) => logger.warn('plugin:', data.toString('utf8').trim()));
      child.on('error', reject);
      child.on('close', () => {
        handleLine(buffer);
        if (outPath) resolve(outPath);
        else reject(failure ?? new Error('The plugin stopped without a result'));
      });
    });
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => undefined);
  }
}
