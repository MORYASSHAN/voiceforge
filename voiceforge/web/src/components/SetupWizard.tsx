import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Config {
  tokenServerUrl: string;
  roomName: string;
  identity: string;
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
  selectedAudioDeviceId?: string;
}

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: (config: Config) => void;
}

type TabType = 'connection' | 'audio' | 'pipeline';

export function SetupWizard({ isOpen, onClose, onConfigured }: SetupWizardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [url, setUrl] = useState('http://localhost:8000');
  const [room, setRoom] = useState('test-room');
  const [name, setName] = useState('user-' + Math.floor(Math.random() * 1000));
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'misconfigured' | 'offline' | null>(null);
  const [testResults, setTestResults] = useState<{ groq?: { valid: boolean; message: string }; livekit?: { valid: boolean; message: string } } | null>(null);
  const [isTestingKeys, setIsTestingKeys] = useState(false);
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testStreamRef = useRef<MediaStream | null>(null);
  const testAnimRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('voiceforge-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tokenServerUrl) setUrl(parsed.tokenServerUrl);
        if (parsed.roomName) setRoom(parsed.roomName);
        if (parsed.identity) setName(parsed.identity);
        if (parsed.noiseSuppression !== undefined) setNoiseSuppression(parsed.noiseSuppression);
        if (parsed.echoCancellation !== undefined) setEchoCancellation(parsed.echoCancellation);
        if (parsed.selectedAudioDeviceId) setSelectedDevice(parsed.selectedAudioDeviceId);
      } catch {
        // ignore parse error
      }
    }

    // Enumerate audio input devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDevice) {
          setSelectedDevice(audioInputs[0].deviceId);
        }
      }).catch(() => {});
    }
  }, []);

  // Probe token server health
  const checkHealth = async (testUrl: string) => {
    setHealthStatus('checking');
    try {
      const res = await fetch(`${testUrl.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data.status === 'healthy' ? 'healthy' : 'misconfigured');
      } else {
        setHealthStatus('misconfigured');
      }
    } catch {
      setHealthStatus('offline');
    }
  };

  useEffect(() => {
    if (isOpen && url) {
      checkHealth(url);
    }
  }, [isOpen, url]);

  // Live test keys against token server
  const handleValidateKeys = async () => {
    setIsTestingKeys(true);
    setTestResults(null);
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/health`);
      if (res.ok) {
        const data = await res.json();
        setTestResults({
          groq: {
            valid: Boolean(data.groq_api_key_present),
            message: data.groq_api_key_present ? 'Configured in backend' : 'Missing GROQ_API_KEY in .env',
          },
          livekit: {
            valid: Boolean(data.livekit_api_key_present && data.livekit_api_secret_present),
            message: data.livekit_api_key_present ? 'Configured in backend' : 'Missing LiveKit keys in .env',
          },
        });
      }
    } catch (e) {
      setError(`Validation failed: ${String(e)}`);
    } finally {
      setIsTestingKeys(false);
    }
  };

  // Microphone audio volume test
  const toggleMicTest = async () => {
    if (isMicTesting) {
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach((t) => t.stop());
        testStreamRef.current = null;
      }
      if (testAnimRef.current) cancelAnimationFrame(testAnimRef.current);
      setMicTestLevel(0);
      setIsMicTesting(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      });
      testStreamRef.current = stream;
      setIsMicTesting(true);

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const updateLevel = () => {
        const buffer = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const lvl = Math.min(100, Math.round(Math.sqrt(sumSquares / buffer.length) * 350));
        setMicTestLevel(lvl);
        testAnimRef.current = requestAnimationFrame(updateLevel);
      };
      testAnimRef.current = requestAnimationFrame(updateLevel);
    } catch (e) {
      setError('Could not access microphone for test: ' + String(e));
    }
  };

  useEffect(() => {
    return () => {
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (testAnimRef.current) cancelAnimationFrame(testAnimRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim()) {
      setError('Token Server URL is required');
      setActiveTab('connection');
      return;
    }
    if (!room.trim()) {
      setError('Room name is required');
      setActiveTab('connection');
      return;
    }
    if (!name.trim()) {
      setError('Identity is required');
      setActiveTab('connection');
      return;
    }

    const config: Config = {
      tokenServerUrl: url.trim().replace(/\/$/, ''),
      roomName: room.trim(),
      identity: name.trim(),
      noiseSuppression,
      echoCancellation,
      selectedAudioDeviceId: selectedDevice,
    };
    localStorage.setItem('voiceforge-config', JSON.stringify(config));
    setError(null);
    onConfigured(config);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel-glow w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden"
        >
          {/* TOP DECORATIVE GLOW */}
          <div className="absolute top-0 left-1/3 right-1/3 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* MODAL HEADER */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-wide text-white">System Configuration</h2>
                <p className="text-xs text-slate-400">Manage connection, audio peripherals & voice pipeline</p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-white/10 font-mono text-xs">
            <button
              onClick={() => setActiveTab('connection')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'connection'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CONNECTION
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'audio'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AUDIO DEVICES
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PIPELINE
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CONNECTION */}
          {activeTab === 'connection' && (
            <div className="space-y-4 text-sm font-sans">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="token-server-url" className="text-slate-300 text-xs font-mono">TOKEN SERVER URL</label>
                  {healthStatus === 'healthy' && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ONLINE & HEALTHY
                    </span>
                  )}
                  {healthStatus === 'misconfigured' && (
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> MISSING KEYS
                    </span>
                  )}
                  {healthStatus === 'offline' && (
                    <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> UNREACHABLE
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="token-server-url"
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      checkHealth(e.target.value);
                    }}
                    placeholder="http://localhost:8000"
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 transition-colors text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="room-name" className="block text-slate-300 text-xs font-mono mb-1">ROOM NAME</label>
                <input
                  id="room-name"
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="test-room"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 transition-colors text-xs"
                />
              </div>

              <div>
                <label htmlFor="participant-identity" className="block text-slate-300 text-xs font-mono mb-1">PARTICIPANT IDENTITY</label>
                <input
                  id="participant-identity"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="user-123"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 transition-colors text-xs"
                />
              </div>

              {/* Optional Key Validation Section */}
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={handleValidateKeys}
                  disabled={isTestingKeys}
                  className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/20 text-xs font-mono flex items-center justify-center gap-2 transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  {isTestingKeys ? 'Validating Live Credentials...' : 'Test Backend Credentials'}
                </button>

                {testResults && (
                  <div className="mt-2 space-y-1 text-[11px] font-mono">
                    {testResults.groq && (
                      <div className={`p-2 rounded-lg ${testResults.groq.valid ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                        {testResults.groq.valid ? '✓ Groq API Key OK' : `✗ ${testResults.groq.message}`}
                      </div>
                    )}
                    {testResults.livekit && (
                      <div className={`p-2 rounded-lg ${testResults.livekit.valid ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                        {testResults.livekit.valid ? '✓ LiveKit Credentials OK' : `✗ ${testResults.livekit.message}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO DEVICES & FILTERS */}
          {activeTab === 'audio' && (
            <div className="space-y-4 text-sm font-sans">
              <div>
                <label htmlFor="microphone-select" className="block text-slate-300 text-xs font-mono mb-1">INPUT MICROPHONE</label>
                <select
                  id="microphone-select"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-slate-200 font-sans focus:outline-none focus:border-cyan-400 transition-colors text-xs cursor-pointer"
                >
                  {audioDevices.length > 0 ? (
                    audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default System Microphone</option>
                  )}
                </select>
              </div>

              {/* LIVE MICROPHONE TEST BAR */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300">MIC INPUT TEST</span>
                  <button
                    onClick={toggleMicTest}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
                      isMicTesting ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {isMicTesting ? 'Stop Test' : 'Test Mic Level'}
                  </button>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-75"
                    style={{ width: `${micTestLevel}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Noise Suppression</div>
                    <div className="text-[11px] text-slate-400">Filters background ambient hiss & fan noise</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="h-[1px] bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Echo Cancellation</div>
                    <div className="text-[11px] text-slate-400">Prevents audio loopback from speaker output</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={echoCancellation}
                    onChange={(e) => setEchoCancellation(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PIPELINE & MODEL INFO */}
          {activeTab === 'pipeline' && (
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10">
                <div className="text-slate-400 mb-1">STT ENGINE</div>
                <div className="text-cyan-300 font-bold">Groq Whisper Large v3 Turbo</div>
                <div className="text-[10px] text-slate-500 mt-1">Ultra-low latency speech transcription</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10">
                <div className="text-slate-400 mb-1">LLM INFERENCE</div>
                <div className="text-purple-300 font-bold">Groq Llama 3.3 70B Versatile</div>
                <div className="text-[10px] text-slate-500 mt-1">Direct token streaming with high reasoning capability</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10">
                <div className="text-slate-400 mb-1">TTS SYNTHESIS</div>
                <div className="text-emerald-300 font-bold">CanopyLabs Orpheus v1 / Kokoro</div>
                <div className="text-[10px] text-slate-500 mt-1">Natural conversational cadence and intonation</div>
              </div>
            </div>
          )}

          {/* ACTIONS FOOTER */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 px-6 py-2.5 rounded-xl font-mono font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 uppercase text-xs tracking-wider"
            >
              Save & Connect
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


