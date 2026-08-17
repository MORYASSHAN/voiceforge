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
  const [url, setUrl] = useState('http://localhost:8000');
  const [room, setRoom] = useState('test-room');
  const [name, setName] = useState('user-' + Math.floor(Math.random() * 1000));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('voiceforge-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tokenServerUrl) setUrl(parsed.tokenServerUrl);
        if (parsed.roomName) setRoom(parsed.roomName);
        if (parsed.identity) setName(parsed.identity);
      } catch {
        // ignore parse error
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim()) {
      setError('Token Server URL is required');
      return;
    }
    if (!room.trim()) {
      setError('Room name is required');
      return;
    }
    if (!name.trim()) {
      setError('Identity is required');
      return;
    }

    const config = {
      tokenServerUrl: url.trim().replace(/\/$/, ''),
      roomName: room.trim(),
      identity: name.trim(),
    };
    localStorage.setItem('voiceforge-config', JSON.stringify(config));
    setError(null);
    onConfigured(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-voiceforge-surface border border-voiceforge-accent/30 rounded-md shadow-2xl shadow-voiceforge-accent/10 max-w-md w-full p-6 font-mono">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-voiceforge-accent">
            <div className="w-3 h-3 rounded-full bg-voiceforge-accent animate-pulse" />
            <h2 className="text-lg uppercase tracking-wider font-bold">Voice Configuration</h2>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close configuration modal"
            className="text-gray-500 hover:text-gray-300 text-sm font-sans"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <label htmlFor="token-server-url" className="block text-gray-400 text-xs">TOKEN_SERVER_URL</label>
            <input 
              id="token-server-url"
              name="tokenServerUrl"
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-cyan-400 focus:outline-none focus:border-voiceforge-accent transition-colors text-xs"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="room-name" className="block text-gray-400 text-xs">ROOM_NAME</label>
            <input 
              id="room-name"
              name="roomName"
              type="text" 
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="test-room"
              className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-cyan-400 focus:outline-none focus:border-voiceforge-accent transition-colors text-xs"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="participant-identity" className="block text-gray-400 text-xs">PARTICIPANT_IDENTITY</label>
            <input 
              id="participant-identity"
              name="participantIdentity"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="user-123"
              className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-cyan-400 focus:outline-none focus:border-voiceforge-accent transition-colors text-xs"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-gray-400 hover:text-white text-xs uppercase"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-voiceforge-accent hover:bg-cyan-400 text-black px-6 py-2 rounded font-bold transition-colors uppercase text-xs tracking-wider"
          >
            Connect & Save
          </button>
        </div>
      </div>
    </div>
  );
}
