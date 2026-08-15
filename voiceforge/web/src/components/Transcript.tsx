import { useEffect, useRef } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

interface TranscriptProps {
  messages: Message[];
}

export function Transcript({ messages }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-voiceforge-surface rounded-lg p-4 font-mono text-sm border border-gray-800">
      <div className="text-xs text-gray-500 mb-4 border-b border-gray-800 pb-2">TRANSCRIPT_LOG</div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] text-gray-600 mb-1">
              {msg.role === 'user' ? 'USER' : 'AGENT'} • {formatTime(msg.timestamp)}
            </div>
            <div 
              className={`max-w-[80%] rounded px-3 py-2 ${
                msg.role === 'user' 
                  ? 'bg-gray-800 text-gray-300' 
                  : 'bg-voiceforge-accent/10 text-voiceforge-accent'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-gray-600 text-center italic mt-10">Awaiting input...</div>
        )}
      </div>
    </div>
  );
}
