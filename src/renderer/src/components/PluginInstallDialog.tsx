/**
 * PluginInstallDialog: where a Pro buyer types the license key from the purchase email.
 * The app then downloads the Pro plugin (a separate program) and installs it.
 */
import { memo, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface Status { installed: boolean; version?: string; serverConfigured: boolean }
type InstallAnswer = { ok: true; status: Status } | { ok: false; reason: string; message: string };

const BUY_URL = 'https://nav2apo.gumroad.com/l/rzvuu';

type Listener = (event: unknown, value: number) => void;
interface Ipc {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, listener: Listener) => void;
  removeListener: (channel: string, listener: Listener) => void;
}
const ipc = () => (window as unknown as { require: (name: string) => { ipcRenderer: Ipc } }).require('electron').ipcRenderer;

function PluginInstallDialog({ visible, onClose }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setPercent(0);
    ipc().invoke('pluginStatus').then((s) => setStatus(s as Status)).catch(() => setStatus({ installed: false, serverConfigured: false }));
  }, [visible]);

  const install = useCallback(async () => {
    setError(null);
    setBusy(true);
    setPercent(0);
    const onProgress = (_e: unknown, p: number) => setPercent(p);
    ipc().on('pluginInstallProgress', onProgress);
    try {
      const answer = (await ipc().invoke('pluginInstall', key)) as InstallAnswer;
      if (answer.ok) setStatus(answer.status);
      else setError(answer.message);
    } catch {
      setError('Something went wrong. Try again, and contact support if it keeps happening.');
    } finally {
      ipc().removeListener('pluginInstallProgress', onProgress);
      setBusy(false);
    }
  }, [key]);

  const text = { fontSize: 13, lineHeight: 1.6, color: '#334155', margin: '0 0 12px' } as const;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { if (!busy) onClose(); }}
        >
          <motion.div
            style={{ background: '#ffffff', borderRadius: 14, width: 'min(460px, 100%)', padding: 24, direction: 'ltr', boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: 18, color: '#0f172a' }}>TrimOut Pro plugin</h2>

            {status?.installed ? (
              <>
                <p style={text}>
                  The Pro plugin is installed{status.version ? ` (version ${status.version})` : ''}. Player spotlight, name card, sounds and music are ready.
                </p>
                <p style={{ ...text, color: '#64748b', fontSize: 12 }}>The plugin checks your license when it works, and keeps working for a few days without internet.</p>
              </>
            ) : (
              <>
                <p style={text}>
                  Enter the license key from your TrimOut Pro purchase email. The plugin is downloaded to your computer and installed.
                </p>
                {status && !status.serverConfigured && (
                  <p style={{ ...text, color: '#b45309' }}>Plugin download is not available yet in this version.</p>
                )}
                <input
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(null); }}
                  placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                  disabled={busy}
                  spellCheck={false}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 14, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 10, fontFamily: 'monospace' }}
                />
                {busy && (
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: '#2faa3f', transition: 'width .2s' }} />
                  </div>
                )}
                {error && <p style={{ ...text, color: '#b91c1c' }}>{error}</p>}
                <p style={{ ...text, fontSize: 12, color: '#64748b' }}>
                  No key yet?{' '}
                  <a href={BUY_URL} target="_blank" rel="noreferrer" style={{ color: '#15803d' }}>Get TrimOut Pro</a>
                  {' '}(you pay only the difference if you already own TrimOut).
                </p>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={onClose} disabled={busy} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                {status?.installed ? 'Close' : 'Cancel'}
              </button>
              {!status?.installed && (
                <button
                  type="button"
                  onClick={install}
                  disabled={busy || key.trim().length < 8 || status?.serverConfigured === false}
                  style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#14210f', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: busy || key.trim().length < 8 ? 0.5 : 1 }}
                >
                  {busy ? 'Installing…' : 'Install plugin'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(PluginInstallDialog);
