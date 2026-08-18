import { motion, AnimatePresence } from 'framer-motion';
import { AgentState } from '../hooks/useLiveKitRoom';
import { ParticleConstellation } from './ParticleConstellation';

export type VisualizerMode = 'orb' | 'spectrum' | 'aura' | 'constellation';

interface VoiceOrbProps {
  state: AgentState;
  userAudioLevel?: number;
  agentAudioLevel?: number;
  frequencyData?: number[];
  mode?: VisualizerMode;
  latencyMs?: number;
  personaName?: string;
  colorTheme?: 'cyan' | 'emerald' | 'amber';
  onClick?: () => void;
}

export function VoiceOrb({
  state,
  userAudioLevel = 0,
  agentAudioLevel = 0,
  frequencyData = new Array(16).fill(0),
  mode = 'orb',
  latencyMs = 38,
  personaName = 'Study Buddy AI',
  colorTheme = 'cyan',
  onClick,
}: VoiceOrbProps) {
  const effectiveAudioLevel = state === 'speaking' ? agentAudioLevel : userAudioLevel;

  // Dynamic glow color
  const getGlowColor = () => {
    switch (state) {
      case 'idle':
        return colorTheme === 'emerald' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(6, 182, 212, 0.35)';
      case 'listening':
        return 'rgba(16, 185, 129, 0.7)';
      case 'thinking':
        return 'rgba(139, 92, 246, 0.8)';
      case 'speaking':
        return colorTheme === 'amber' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(6, 182, 212, 0.9)';
      default:
        return 'rgba(6, 182, 212, 0.35)';
    }
  };

  const getStateTitle = () => {
    switch (state) {
      case 'idle':
        return 'READY TO TALK';
      case 'listening':
        return 'LISTENING...';
      case 'thinking':
        return 'THINKING...';
      case 'speaking':
        return 'AI SPEAKING';
      default:
        return 'STANDBY';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-2xl mx-auto">
      {/* Session Title & State Pill */}
      <div className="mb-6 text-center z-10">
        <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1 flex items-center justify-center gap-2">
          <span>VOICE SESSION</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400 font-semibold">{personaName}</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full inline-block ${
                state === 'speaking'
                  ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-ping'
                  : state === 'listening'
                  ? 'bg-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse'
                  : state === 'thinking'
                  ? 'bg-purple-400 shadow-[0_0_15px_#c084fc] animate-spin'
                  : 'bg-slate-500'
              }`}
            />
            {getStateTitle()}
          </h2>
        </div>
        <div className="flex items-center justify-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
          <span>Latency: <strong className="text-cyan-400">{latencyMs}ms</strong></span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active VAD
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Barge-in Enabled</span>
        </div>
      </div>

      {/* Main Visualizer Stage Area */}
      <div
        className="relative flex items-center justify-center w-80 h-80 sm:w-96 sm:h-96 cursor-pointer group"
        onClick={onClick}
      >
        {/* Ambient background bloom */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-60 transition-all duration-500 pointer-events-none"
          style={{
            backgroundColor: getGlowColor(),
            transform: `scale(${1 + effectiveAudioLevel * 0.7})`,
          }}
        />

        {/* MODE 1: 3D HOLOGRAPHIC QUANTUM ORB */}
        {mode === 'orb' && (
          <div className="relative flex items-center justify-center">
            {/* Concentric Shockwave Ripples */}
            <AnimatePresence>
              {(state === 'listening' || state === 'speaking') && (
                <>
                  <motion.div
                    className="absolute w-60 h-60 rounded-full border border-cyan-400/40 pointer-events-none"
                    animate={{
                      scale: [1, 1.45 + effectiveAudioLevel * 0.9],
                      opacity: [0.65, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                  <motion.div
                    className="absolute w-60 h-60 rounded-full border border-purple-500/35 pointer-events-none"
                    animate={{
                      scale: [1, 1.8 + effectiveAudioLevel * 1.1],
                      opacity: [0.45, 0],
                    }}
                    transition={{
                      duration: 2.1,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 0.35,
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Orbiting Gyro Ring 1 */}
            <motion.div
              className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-dashed border-cyan-400/35 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            />

            {/* Orbiting Gyro Ring 2 */}
            <motion.div
              className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-purple-400/30 pointer-events-none"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />

            {/* Quantum Fluid Energy Sphere */}
            <motion.div
              className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center overflow-hidden shadow-2xl"
              style={{
                background:
                  state === 'thinking'
                    ? 'radial-gradient(circle at 35% 35%, #c084fc, #9333ea 45%, #3b0764 90%)'
                    : state === 'listening'
                    ? 'radial-gradient(circle at 35% 35%, #34d399, #059669 45%, #064e3b 90%)'
                    : 'radial-gradient(circle at 35% 35%, #67e8f9, #06b6d4 40%, #4338ca 75%, #0f172a 100%)',
                boxShadow: `0 0 ${40 + effectiveAudioLevel * 70}px ${getGlowColor()}, inset 0 0 30px rgba(255,255,255,0.5)`,
              }}
              animate={{
                scale:
                  state === 'speaking'
                    ? [1, 1.1 + effectiveAudioLevel * 0.45, 1.02]
                    : state === 'listening'
                    ? [1, 1.06 + effectiveAudioLevel * 0.35, 1]
                    : state === 'thinking'
                    ? [0.96, 1.04, 0.96]
                    : [1, 1.03, 1],
              }}
              transition={{
                duration: state === 'speaking' ? 0.12 : state === 'thinking' ? 1.4 : 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Internal Chromatic Shimmer */}
              <motion.div
                className="absolute inset-0 opacity-80 mix-blend-overlay"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.85) 120deg, transparent 240deg)',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: state === 'speaking' ? 1.8 : state === 'thinking' ? 0.9 : 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Heartbeat Core */}
              <motion.div
                className="w-14 h-14 rounded-full bg-white/50 blur-sm mix-blend-screen"
                animate={{
                  scale: [0.75, 1.35 + effectiveAudioLevel * 0.7, 0.75],
                  opacity: [0.6, 0.98, 0.6],
                }}
                transition={{
                  duration: state === 'speaking' ? 0.15 : 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>
        )}

        {/* MODE 2: KINETIC FREQUENCY SPECTRUM */}
        {mode === 'spectrum' && (
          <div className="relative z-10 flex items-center justify-center gap-2 h-44 px-8 py-6 glass-panel-glow rounded-3xl border border-cyan-500/40 shadow-2xl">
            {frequencyData.map((val, idx) => {
              const heightPct = Math.max(10, Math.min(100, (val + effectiveAudioLevel * 0.75) * 100));
              return (
                <motion.div
                  key={idx}
                  className="w-3 rounded-full bg-gradient-to-t from-cyan-600 via-cyan-300 to-purple-400"
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.07, ease: 'linear' }}
                  style={{
                    boxShadow: '0 0 12px rgba(6, 182, 212, 0.6)',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* MODE 3: CONCENTRIC SONIC RADAR AURA */}
        {mode === 'aura' && (
          <div className="relative z-10 flex items-center justify-center">
            <motion.div
              className="w-48 h-48 rounded-full border-4 border-cyan-400/90 flex items-center justify-center"
              style={{ boxShadow: `0 0 45px ${getGlowColor()}` }}
              animate={{
                scale: [1, 1.15 + effectiveAudioLevel * 0.55, 1],
              }}
              transition={{ duration: 0.25, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-24 h-24 rounded-full bg-cyan-400/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <div className="w-8 h-8 rounded-full bg-cyan-300 shadow-[0_0_20px_#22d3ee] animate-ping" />
              </div>
            </motion.div>
          </div>
        )}

        {/* MODE 4: PARTICLE CONSTELLATION */}
        {mode === 'constellation' && (
          <div className="relative z-10 w-80 h-80 sm:w-96 sm:h-96 glass-panel rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center">
            <ParticleConstellation
              audioLevel={effectiveAudioLevel}
              frequencyData={frequencyData}
              colorTheme={colorTheme}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-400/60 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <div className="w-6 h-6 rounded-full bg-cyan-300 shadow-[0_0_15px_#22d3ee]" />
              </div>
              <span className="text-[10px] font-mono text-cyan-300 mt-2">NEBULA MATRIX</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


