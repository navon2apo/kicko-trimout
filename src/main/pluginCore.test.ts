import { describe, expect, it } from 'vitest';
import { absoluteToolPath, buildPluginCommand, explainPluginFailure, parsePluginLine, tidyLicenseKey } from './pluginCore';

describe('plugin messages', () => {
  it('reads progress, done and error lines', () => {
    expect(parsePluginLine('{"type":"progress","percent":42}')).toEqual({ type: 'progress', percent: 42 });
    expect(parsePluginLine(String.raw`{"type":"done","outPath":"C:\\a.mp4"}`)).toEqual({ type: 'done', outPath: String.raw`C:\a.mp4` });
    expect(parsePluginLine('{"type":"error","code":"license","reason":"revoked","message":"no"}')).toEqual({ type: 'error', code: 'license', reason: 'revoked', message: 'no' });
  });

  it('ignores lines that are not messages', () => {
    expect(parsePluginLine('')).toBeNull();
    expect(parsePluginLine('some ffmpeg noise')).toBeNull();
    expect(parsePluginLine('{"type":"mystery"}')).toBeNull();
    expect(parsePluginLine('{"type":"progress","percent":"high"}')).toBeNull();
  });
});

describe('running the plugin as its own program', () => {
  it('starts the plugin file with the app as a plain runtime, in its own process', () => {
    const cmd = buildPluginCommand({ execPath: String.raw`C:\App\TrimOut.exe`, pluginDir: String.raw`C:\Data\plugins\kicko-lock`, jobFile: String.raw`C:\Temp\job.json`, baseEnv: { PATH: 'x' } });
    expect(cmd.command).toBe(String.raw`C:\App\TrimOut.exe`);
    expect(cmd.args).toEqual([String.raw`C:\Data\plugins\kicko-lock\plugin.mjs`, 'run', String.raw`C:\Temp\job.json`]);
    expect(cmd.env['ELECTRON_RUN_AS_NODE']).toBe('1');
    expect(cmd.env['PATH']).toBe('x');
    expect(cmd.cwd).toBe(String.raw`C:\Data\plugins\kicko-lock`);
  });
});

describe('the ffmpeg path given to the plugin', () => {
  it('is made absolute, because the plugin runs from its own folder', () => {
    expect(absoluteToolPath(String.raw`ffmpeg\win32-x64\lib\ffmpeg.exe`, String.raw`D:\app`)).toBe(String.raw`D:\app\ffmpeg\win32-x64\lib\ffmpeg.exe`);
  });

  it('keeps a path that is already absolute', () => {
    expect(absoluteToolPath(String.raw`C:\Program Files\App\resources\ffmpeg.exe`, String.raw`D:\app`)).toBe(String.raw`C:\Program Files\App\resources\ffmpeg.exe`);
  });
});

describe('license key typed by the user', () => {
  it('trims spaces and rejects an empty text', () => {
    expect(tidyLicenseKey('  ABCD1234-ABCD1234  ')).toBe('ABCD1234-ABCD1234');
    expect(tidyLicenseKey('   ')).toBeNull();
    expect(tidyLicenseKey('abc')).toBeNull();
  });
});

describe('messages for the person', () => {
  it('explains each reason in plain words', () => {
    expect(explainPluginFailure('unknown_key')).toMatch(/not recognized/i);
    expect(explainPluginFailure('not_pro')).toMatch(/Pro/);
    expect(explainPluginFailure('revoked')).toMatch(/refund/i);
    expect(explainPluginFailure('too_many_devices')).toMatch(/computers/i);
    expect(explainPluginFailure('service_unavailable')).toMatch(/internet/i);
    expect(explainPluginFailure('offline_expired')).toMatch(/internet/i);
    expect(explainPluginFailure('something_new')).toMatch(/something went wrong/i);
  });
});
