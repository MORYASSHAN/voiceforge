import { useState, useEffect } from 'react';
import { SetupWizard } from './components/SetupWizard';
import { VoiceOrb } from './components/VoiceOrb';
import { Transcript, Message } from './components/Transcript';
import { useLiveKitRoom } from './hooks/useLiveKitRoom';
import { ConnectionState } from 'livekit-client';

function App() {
  const [showWizard, setShowWizard] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { 
    room, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    toggleMicrophone, 
    isMicMuted, 
    agentState 
  } = useLiveKitRoom();

  useEffect(() => {
    const saved = localStorage.getItem('voiceforge-config');
    if (!saved) {
      setShowWizard(true);
    }
  }, []);

  const handleConfigured = (config: { tokenServerUrl: string, roomName: string, identity: string }) => {
    connect(config.tokenServerUrl, config.roomName, config.identity);
  };

  return (
    <div className="min-h-screen bg-voiceforge-bg text-gray-200 flex flex-col font-sans">
      <header className="flex-none p-6 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded bg-voiceforge-accent flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          </div>
          <h1 className="text-xl font-mono tracking-wider text-white">VOICE<span className="text-voiceforge-accent">FORGE</span></h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 font-mono text-sm">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : isConnecting ? 'bg-yellow-400' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-green-400' : isConnecting ? 'text-yellow-400' : 'text-gray-500'}>
              {isConnected ? 'SYS.ONLINE' : isConnecting ? 'SYS.BOOTING' : 'SYS.OFFLINE'}
            </span>
          </div>
          
          <button 
            onClick={() => setShowWizard(true)}
            className="p-2 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-8">
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <VoiceOrb state={isConnected ? agentState : 'idle'} />
          
          <div className="mt-16 flex space-x-4">
            {isConnected ? (
              <>
                <button
                  onClick={toggleMicrophone}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isMicMuted 
                      ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' 
                      : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {isMicMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                  )}
                </button>
                <button
                  onClick={disconnect}
                  className="w-14 h-14 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center hover:bg-red-500/30 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" x2="1" y1="1" y2="23"></line></svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const saved = localStorage.getItem('voiceforge-config');
                  if (saved) {
                    handleConfigured(JSON.parse(saved));
                  } else {
                    setShowWizard(true);
                  }
                }}
                disabled={isConnecting}
                className="px-8 py-3 bg-voiceforge-accent hover:bg-cyan-400 text-black font-mono font-bold rounded flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <span>{isConnecting ? 'CONNECTING...' : 'INITIATE_LINK'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full lg:w-96 flex-none flex flex-col h-[50vh] lg:h-auto">
          <Transcript messages={messages} />
        </div>
      </main>

      <SetupWizard 
        isOpen={showWizard} 
        onClose={() => setShowWizard(false)} 
        onConfigured={handleConfigured} 
      />
    </div>
  );
}

export default App;
