import { motion, AnimatePresence } from 'framer-motion';
import { AgentState } from '../hooks/useLiveKitRoom';

interface VoiceOrbProps {
  state: AgentState;
  audioLevel?: number;
  onClick?: () => void;
}

export function VoiceOrb({ state, audioLevel = 0, onClick }: VoiceOrbProps) {
  const getGlowColor = () => {
    switch (state) {
      case 'idle': return 'rgba(6, 182, 212, 0.3)';
      case 'listening': return 'rgba(6, 182, 212, 0.6)';
      case 'thinking': return 'rgba(139, 92, 246, 0.6)';
      case 'speaking': return 'rgba(6, 182, 212, 0.8)';
      default: return 'rgba(6, 182, 212, 0.3)';
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center w-64 h-64 cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute inset-0 rounded-full blur-3xl opacity-50 transition-colors duration-1000"
           style={{ backgroundColor: getGlowColor() }} />
      
      <motion.div
        className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr from-voiceforge-accent to-cyan-300 flex items-center justify-center shadow-lg"
        animate={{
          scale: state === 'speaking' ? [1, 1.1 + (audioLevel * 0.5), 1] : state === 'listening' ? [1, 1.05, 1] : 1,
          boxShadow: `0 0 ${20 + (audioLevel * 50)}px ${getGlowColor()}`
        }}
        transition={{
          duration: state === 'speaking' ? 0.1 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <AnimatePresence>
          {state === 'thinking' && (
            <motion.div
              className="absolute inset-0 rounded-full border-t-2 border-r-2 border-white opacity-70"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
          
          {state === 'listening' && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-voiceforge-accent opacity-50"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
