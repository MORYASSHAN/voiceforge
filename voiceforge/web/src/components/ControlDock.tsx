import { motion } from 'framer-motion';
import { VisualizerMode } from './VoiceOrb';
import { AgentState } from '../hooks/useLiveKitRoom';

interface ControlDockProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicMuted: boolean;
  agentState: AgentState;
  userAudioLevel: number;
  visualizerMode: VisualizerMode;
  isTranscriptOpen: boolean;
  unreadCount?: number;
  onToggleMic: () => void;
  onInterrupt: () => void;
  onToggleVisualizer: () => void;
  onToggleTranscript: () => void;
  onOpenSettings: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ControlDock({
  isConnected,
  isConnecting,
  isMicMuted,
  agentState,
  userAudioLevel,
  visualizerMode,
  isTranscriptOpen,
  unreadCount = 0,
  onToggleMic,
  onInterrupt,
  onToggleVisualizer,
  onToggleTranscript,
  onOpenSettings,
  onConnect,
  onDisconnect,
}: ControlDockProps) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative flex items-center justify-center"
    >
      {/* Floating Glassmorphic Pill Dock */}
      <div className="glass-panel px-4 py-3 rounded-full border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-center gap-3 sm:gap-4 transition-all">
        {/* VISUALIZER MODE TOGGLE */}
        <button
          onClick={onToggleVisualizer}
          title={`Switch Visualizer Mode (Current: ${visualizerMode.toUpperCase()})`}
          aria-label="Toggle visualizer style"
          className="flex flex-col items-center justify-center p-2.5 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all group relative"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:bg-cyan-950/30 transition-all">
            {visualizerMode === 'orb' && (
              <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            )}
            {visualizerMode === 'spectrum' && (
              <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10v4M8 6v12M12 2v20M16 6v12M20 10v4" />
              </svg>
            )}
            {visualizerMode === 'aura' && (
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            {visualizerMode === 'constellation' && (
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="2" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="19" cy="8" r="1.5" />
                <circle cx="7" cy="17" r="1.5" />
                <circle cx="17" cy="17" r="1.5" />
                <line x1="5" y1="8" x2="12" y2="12" />
                <line x1="19" y1="8" x2="12" y2="12" />
                <line x1="7" y1="17" x2="12" y2="12" />
                <line x1="17" y1="17" x2="12" y2="12" />
              </svg>
            )}
          </div>
          <span className="text-[10px] font-mono mt-1 text-slate-400 group-hover:text-cyan-300 hidden sm:block">
            {visualizerMode === 'constellation' ? 'NEBULA' : visualizerMode.toUpperCase()}
          </span>
        </button>

        {/* CONNECTED CONTROLS: MIC, INTERRUPT, DISCONNECT */}
        {isConnected ? (
          <>
            {/* MICROPHONE WITH LIVE CIRCULAR VU METER */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Dynamic VU Meter Ring */}
              <div
                className="absolute inset-0 rounded-full border-2 transition-transform duration-75 pointer-events-none"
                style={{
                  borderColor: isMicMuted
                    ? 'rgba(244, 63, 94, 0.4)'
                    : 'rgba(6, 182, 212, 0.8)',
                  transform: `scale(${1 + (!isMicMuted ? userAudioLevel * 0.45 : 0)})`,
                  boxShadow: !isMicMuted && userAudioLevel > 0.05
                    ? '0 0 25px rgba(6, 182, 212, 0.8)'
                    : 'none',
                }}
              />

              <button
                onClick={onToggleMic}
                title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMicMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30'
                    : 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] hover:scale-105'
                }`}
              >
                {isMicMuted ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>
              <span className="text-[10px] font-mono mt-1 text-slate-400 hidden sm:block">
                {isMicMuted ? 'MUTED' : 'MIC ON'}
              </span>
            </div>

            {/* INTERRUPT / BARGE-IN BUTTON */}
            <button
              onClick={onInterrupt}
              title="Interrupt AI Speech"
              aria-label="Interrupt AI"
              disabled={agentState !== 'speaking'}
              className={`flex flex-col items-center justify-center p-2.5 rounded-full transition-all group ${
                agentState === 'speaking'
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-600 opacity-40 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  agentState === 'speaking'
                    ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
                    : 'bg-slate-800/40 border-slate-700/40'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </div>
              <span className="text-[10px] font-mono mt-1 text-slate-400 group-hover:text-amber-300 hidden sm:block">
                INTERRUPT
              </span>
            </button>

            {/* END CALL / DISCONNECT BUTTON */}
            <button
              onClick={onDisconnect}
              title="Disconnect Voice Session"
              aria-label="End call"
              className="flex flex-col items-center justify-center p-2.5 rounded-full text-rose-400 hover:text-rose-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center group-hover:bg-rose-500/30 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all">
                <svg className="w-5 h-5 rotate-[135deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <span className="text-[10px] font-mono mt-1 text-slate-400 group-hover:text-rose-300 hidden sm:block">
                END CALL
              </span>
            </button>
          </>
        ) : (
          /* DISCONNECTED: INITIATE LINK BUTTON */
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-mono font-bold rounded-full flex items-center gap-3 transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] hover:scale-[1.02]"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
            <span className="tracking-wider">
              {isConnecting ? 'CONNECTING...' : 'INITIATE_LINK'}
            </span>
          </button>
        )}

        {/* TRANSCRIPT DRAWER TOGGLE */}
        <button
          onClick={onToggleTranscript}
          title="Toggle Live Transcript"
          aria-label="Toggle transcript"
          className={`flex flex-col items-center justify-center p-2.5 rounded-full transition-all group relative ${
            isTranscriptOpen
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              isTranscriptOpen
                ? 'bg-cyan-500/20 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/80 border-slate-700/60 group-hover:border-slate-500'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {unreadCount > 0 && !isTranscriptOpen && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-mono font-bold text-black flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono mt-1 text-slate-400 group-hover:text-cyan-300 hidden sm:block">
            CHAT
          </span>
        </button>

        {/* SETTINGS BUTTON */}
        <button
          onClick={onOpenSettings}
          title="Audio & System Settings"
          aria-label="Settings"
          className="flex flex-col items-center justify-center p-2.5 rounded-full text-slate-400 hover:text-slate-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center group-hover:border-slate-500 group-hover:bg-slate-700/50 transition-all">
            <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span className="text-[10px] font-mono mt-1 text-slate-400 group-hover:text-slate-200 hidden sm:block">
            CONFIG
          </span>
        </button>
      </div>
    </motion.div>
  );
}
