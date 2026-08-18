import { useState, useEffect, useCallback } from 'react';
import { SetupWizard, Config } from './components/SetupWizard';
import { VoiceOrb, VisualizerMode } from './components/VoiceOrb';
import { Transcript } from './components/Transcript';
import { ControlDock } from './components/ControlDock';
import { TelemetryHUD } from './components/TelemetryHUD';
import { PersonaSelector } from './components/PersonaSelector';
import { useLiveKitRoom } from './hooks/useLiveKitRoom';
import { useSoundEffects } from './hooks/useSoundEffects';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [showWizard, setShowWizard] = useState(false);
  const [showPersonas, setShowPersonas] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('orb');
  const [colorTheme, setColorTheme] = useState<'cyan' | 'emerald' | 'amber'>('cyan');

  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    toggleMicrophone,
    interruptAgent,
    isMicMuted,
    agentState,
    messages,
    setMessages,
    userAudioLevel,
    agentAudioLevel,
    frequencyData,
    sessionSeconds,
    latencyMs,
    tokenUsage,
    personas,
    fetchPersonas,
    activePersona,
    setActivePersona,
  } = useLiveKitRoom();

  const {
    playConnectSound,
    playDisconnectSound,
    playMuteSound,
    playInterruptSound,
  } = useSoundEffects(true);

  useEffect(() => {
    const saved = localStorage.getItem('voiceforge-config');
    if (!saved) {
      setShowWizard(true);
    }
  }, []);

  const handleConfigured = (config: Config) => {
    playConnectSound();
    connect(config.tokenServerUrl, config.roomName, config.identity);
  };

  const handleDisconnect = () => {
    playDisconnectSound();
    disconnect();
  };

  const handleToggleMic = () => {
    playMuteSound(!isMicMuted);
    toggleMicrophone();
  };

  const handleInterrupt = () => {
    playInterruptSound();
    interruptAgent();
  };

  const handleToggleVisualizer = useCallback(() => {
    setVisualizerMode((prev) => {
      if (prev === 'orb') return 'spectrum';
      if (prev === 'spectrum') return 'aura';
      if (prev === 'aura') return 'constellation';
      return 'orb';
    });
  }, []);

  const handleCycleTheme = useCallback(() => {
    setColorTheme((prev) => {
      if (prev === 'cyan') return 'emerald';
      if (prev === 'emerald') return 'amber';
      return 'cyan';
    });
  }, []);

  const handleInitiate = () => {
    const saved = localStorage.getItem('voiceforge-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        handleConfigured(parsed);
      } catch {
        setShowWizard(true);
      }
    } else {
      setShowWizard(true);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === ' ' && isConnected) {
        e.preventDefault();
        handleToggleMic();
      } else if (e.key === 'Escape' && isConnected && agentState === 'speaking') {
        e.preventDefault();
        handleInterrupt();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsTranscriptOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handleToggleVisualizer();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowPersonas(true);
      } else if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowWizard(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, agentState, isMicMuted, handleToggleVisualizer]);

  const activePersonaObj = personas.find((p) => p.slug === activePersona);
  const personaDisplayName = activePersonaObj?.name || 'Study Buddy AI';

  return (
    <div className={`min-h-screen bg-voiceforge-bg text-slate-100 flex flex-col font-sans overflow-hidden relative selection:bg-cyan-500/30 selection:text-white ${colorTheme === 'emerald' ? 'theme-emerald' : colorTheme === 'amber' ? 'theme-amber' : ''}`}>
      {/* AMBIENT BACKGROUND GLOW BLOOMS */}
      <div
        className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
          colorTheme === 'emerald' ? 'bg-emerald-500/10' : colorTheme === 'amber' ? 'bg-amber-500/10' : 'bg-cyan-500/10'
        }`}
      />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div
        className={`absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
          colorTheme === 'emerald' ? 'bg-teal-500/10' : colorTheme === 'amber' ? 'bg-rose-500/10' : 'bg-cyan-500/10'
        }`}
      />

      {/* TOP NAVIGATION & TELEMETRY HUD */}
      <TelemetryHUD
        isConnected={isConnected}
        isConnecting={isConnecting}
        activePersona={activePersona}
        personas={personas}
        sessionSeconds={sessionSeconds}
        latencyMs={latencyMs}
        tokenUsage={tokenUsage}
        colorTheme={colorTheme}
        onCycleTheme={handleCycleTheme}
        onOpenPersonas={() => setShowPersonas(true)}
        onOpenSettings={() => setShowWizard(true)}
      />

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex overflow-hidden p-4 sm:p-6 gap-6 relative">
        {/* CENTER STAGE: VISUALIZER & DOCK */}
        <div className="flex-1 flex flex-col items-center justify-between relative z-10 py-4">
          <div className="w-full" />

          {/* DYNAMIC AUDIO-REACTIVE VOICE ORB */}
          <div className="flex-1 flex items-center justify-center w-full">
            <VoiceOrb
              state={isConnected ? agentState : 'idle'}
              userAudioLevel={userAudioLevel}
              agentAudioLevel={agentAudioLevel}
              frequencyData={frequencyData}
              mode={visualizerMode}
              latencyMs={latencyMs}
              personaName={personaDisplayName}
              colorTheme={colorTheme}
              onClick={() => {
                if (!isConnected) handleInitiate();
                else handleToggleVisualizer();
              }}
            />
          </div>

          {/* FLOATING GLASSMORPHIC CONTROL DOCK */}
          <div className="w-full flex justify-center pb-2">
            <ControlDock
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMicMuted={isMicMuted}
              agentState={agentState}
              userAudioLevel={userAudioLevel}
              visualizerMode={visualizerMode}
              isTranscriptOpen={isTranscriptOpen}
              unreadCount={messages.length}
              onToggleMic={handleToggleMic}
              onInterrupt={handleInterrupt}
              onToggleVisualizer={handleToggleVisualizer}
              onToggleTranscript={() => setIsTranscriptOpen(!isTranscriptOpen)}
              onOpenSettings={() => setShowWizard(true)}
              onConnect={handleInitiate}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>

        {/* SIDE TRANSCRIPT DRAWER */}
        <AnimatePresence>
          {isTranscriptOpen && (
            <motion.aside
              initial={{ opacity: 0, x: 300, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '380px' }}
              exit={{ opacity: 0, x: 300, width: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="hidden lg:flex flex-col h-full flex-none z-10"
            >
              <Transcript
                messages={messages}
                personaName={personaDisplayName}
                isOpen={isTranscriptOpen}
                onClose={() => setIsTranscriptOpen(false)}
                onClear={() => setMessages([])}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* MOBILE TRANSCRIPT OVERLAY DRAWER */}
      <AnimatePresence>
        {isTranscriptOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-x-0 bottom-0 top-20 z-40 p-4 bg-black/90 backdrop-blur-xl"
          >
            <Transcript
              messages={messages}
              personaName={personaDisplayName}
              isOpen={isTranscriptOpen}
              onClose={() => setIsTranscriptOpen(false)}
              onClear={() => setMessages([])}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS: SETUP WIZARD & PERSONA SELECTOR */}
      <SetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onConfigured={handleConfigured}
      />

      <PersonaSelector
        isOpen={showPersonas}
        personas={personas}
        activePersona={activePersona}
        onSelectPersona={(slug) => setActivePersona(slug)}
        onRefreshPersonas={fetchPersonas}
        onClose={() => setShowPersonas(false)}
      />
    </div>
  );
}

export default App;


