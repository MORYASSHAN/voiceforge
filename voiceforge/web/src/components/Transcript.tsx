import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  latency?: number;
}

interface TranscriptProps {
  messages: Message[];
  personaName?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onClear?: () => void;
}

function FormattedContent({ text }: { text: string }) {
  // Check if content has markdown code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const lang = lines[0].trim();
          const code = (lang && lines.length > 1) ? lines.slice(1).join('\n') : lines.join('\n');
          return (
            <div key={idx} className="my-2 rounded-xl bg-slate-950/90 border border-slate-700/60 overflow-hidden text-xs font-mono">
              {lang && (
                <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                  {lang}
                </div>
              )}
              <pre className="p-3 text-cyan-200 overflow-x-auto custom-scrollbar leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <p key={idx} className="whitespace-pre-wrap">{part}</p>;
      })}
    </div>
  );
}

export function Transcript({
  messages,
  personaName = 'Study Buddy AI',
  onClose,
  onClear,
}: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyAll = () => {
    const text = messages
      .map(
        (m) =>
          `[${formatTime(m.timestamp)}] ${m.role === 'user' ? 'User' : personaName}: ${m.content}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const content = `# VoiceForge Session Transcript\n**Persona:** ${personaName}\n**Date:** ${new Date().toLocaleString()}\n\n---\n\n` +
      messages
        .map(
          (m) =>
            `### ${m.role === 'user' ? '👤 User' : `🎙️ ${personaName}`} *(${formatTime(m.timestamp)})*\n\n${m.content}\n`
        )
        .join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceforge-transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const data = {
      persona: personaName,
      exportedAt: new Date().toISOString(),
      turns: messages,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceforge-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl">
      {/* DRAWER HEADER */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-semibold text-white text-sm tracking-wide">Live Conversation Studio</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {messages.length} turns
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              title="Close transcript"
              aria-label="Close transcript"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      {messages.length > 1 && (
        <div className="px-4 py-2 border-b border-white/5 bg-black/20">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live conversation..."
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all pl-8"
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      )}

      {/* MESSAGES LIST */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {filteredMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Speaker Metadata Pill */}
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-mono text-slate-400">
                <span className={`font-semibold ${msg.role === 'user' ? 'text-cyan-300' : 'text-purple-300'}`}>
                  {msg.role === 'user' ? '👤 You:' : `🎙️ ${personaName}:`}
                </span>
                {msg.latency && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-400 border border-slate-700">
                    ⚡ {msg.latency}ms
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.15)] rounded-br-sm'
                    : 'bg-slate-900/85 text-slate-200 border border-white/10 shadow-lg rounded-bl-sm backdrop-blur-md'
                }`}
              >
                <FormattedContent text={msg.content} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <p className="text-xs font-mono">Awaiting spoken dialogue...</p>
            <p className="text-[11px] text-slate-600 mt-1">Speak into your microphone to start real-time transcription.</p>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      {messages.length > 0 && (
        <div className="p-3 border-t border-white/10 bg-white/[0.01] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportMarkdown}
              title="Download Markdown"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Markdown</span>
            </button>

            <button
              onClick={handleExportJson}
              title="Download JSON format"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <span>JSON</span>
            </button>
          </div>

          {onClear && (
            <button
              onClick={onClear}
              title="Clear transcript log"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}


