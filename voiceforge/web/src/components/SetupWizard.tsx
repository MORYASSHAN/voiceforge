import { useState, useEffect } from 'react';

interface Config {
  tokenServerUrl: string;
  roomName: string;
  identity: string;
}

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: (config: Config) => void;
}

export function SetupWizard({ isOpen, onClose, onConfigured }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('http://localhost:8000');
  const [room, setRoom] = useState('test-room');
  const [name, setName] = useState('user-' + Math.floor(Math.random() * 1000));

  useEffect(() => {
    const saved = localStorage.getItem('voiceforge-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUrl(parsed.tokenServerUrl || url);
        setRoom(parsed.roomName || room);
        setName(parsed.identity || name);
      } catch (e) {}
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    const config = { tokenServerUrl: url, roomName: room, identity: name };
    localStorage.setItem('voiceforge-config', JSON.stringify(config));
    onConfigured(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-voiceforge-surface border border-voiceforge-accent/30 rounded-md shadow-2xl shadow-voiceforge-accent/10 max-w-md w-full p-6 font-mono">
        
        <div className="flex items-center space-x-2 mb-6 text-voiceforge-accent">
          <div className="w-3 h-3 rounded-full bg-voiceforge-accent animate-pulse" />
          <h2 className="text-lg uppercase tracking-wider">Configuration</h2>
        </div>

        <div className="space-y-6 text-sm">
          {step >= 1 && (
            <div className="space-y-2">
              <label className="block text-gray-400">SERVER_URL=</label>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-cyan-400 focus:outline-none focus:border-voiceforge-accent transition-colors"
              />
            </div>
          )}

          {step >= 1 && (
            <div className="space-y-2">
              <label className="block text-gray-400">ROOM_NAME=</label>
              <input 
                type="text" 
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-cyan-400 focus:outline-none focus:border-voiceforge-accent transition-colors"
              />
            </div>
          )}

          {step >= 1 && (
            <div className="space-y-2">
              <label className="block text-gray-400">IDENTITY=</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-cyan-400 focus:outline-none focus:border-voiceforge-accent transition-colors"
              />
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-voiceforge-accent hover:bg-cyan-400 text-black px-6 py-2 rounded font-bold transition-colors uppercase text-sm tracking-wider"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
