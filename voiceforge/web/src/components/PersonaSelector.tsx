import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Persona } from '../hooks/useLiveKitRoom';

interface PersonaSelectorProps {
  isOpen: boolean;
  personas: Persona[];
  activePersona: string;
  onSelectPersona: (slug: string) => void;
  onRefreshPersonas?: () => void;
  onClose: () => void;
}

const PERSONA_ICONS: Record<string, { icon: string; gradient: string; badge: string }> = {
  study_buddy: {
    icon: '🎓',
    gradient: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40',
    badge: 'Academic Tutor',
  },
  meeting_notes: {
    icon: '📝',
    gradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40',
    badge: 'Executive Copilot',
  },
  voice_journal: {
    icon: '📖',
    gradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40',
    badge: 'Reflective Companion',
  },
  pirate: {
    icon: '🏴‍☠️',
    gradient: 'from-amber-500/20 to-red-500/20 border-amber-500/40',
    badge: 'Entertainment',
  },
  code_mentor: {
    icon: '💻',
    gradient: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40',
    badge: 'Tech Specialist',
  },
};

export function PersonaSelector({
  isOpen,
  personas,
  activePersona,
  onSelectPersona,
  onRefreshPersonas,
  onClose,
}: PersonaSelectorProps) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [customName, setCustomName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveCustom = async () => {
    if (!customName.trim()) {
      setErrorMsg('Persona Name is required');
      return;
    }
    if (!customPrompt.trim()) {
      setErrorMsg('System Prompt instructions are required');
      return;
    }
    const slug = (customSlug.trim() || customName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const saved = localStorage.getItem('voiceforge-config');
      const tokenUrl = saved ? (JSON.parse(saved).tokenServerUrl || 'http://localhost:8000') : 'http://localhost:8000';
      
      const res = await fetch(`${tokenUrl}/personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: customName.trim(),
          system_prompt: customPrompt.trim(),
          description: customDesc.trim() || undefined,
        }),
      });

      if (res.ok) {
        if (onRefreshPersonas) onRefreshPersonas();
        onSelectPersona(slug);
        setView('list');
        setCustomName('');
        setCustomSlug('');
        setCustomPrompt('');
        setCustomDesc('');
        onClose();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Failed to save custom persona');
      }
    } catch (e) {
      setErrorMsg(`Server error: ${String(e)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="glass-panel-glow w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden"
        >
          {/* Top Accent Glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                🎭
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Persona Studio</h2>
                <p className="text-xs text-slate-400">Choose or create your custom real-time voice AI personality</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === 'list' ? 'create' : 'list')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              >
                {view === 'list' ? '+ Create New' : '← Back to List'}
              </button>
              <button
                onClick={onClose}
                aria-label="Close persona modal"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* VIEW 1: PERSONAS LIST */}
          {view === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
              {personas.map((persona) => {
                const meta = PERSONA_ICONS[persona.slug] || {
                  icon: '🤖',
                  gradient: 'from-slate-800 to-slate-900 border-slate-700',
                  badge: 'Custom Agent',
                };
                const isSelected = activePersona === persona.slug;

                return (
                  <div
                    key={persona.slug}
                    onClick={() => {
                      onSelectPersona(persona.slug);
                      onClose();
                    }}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                        : 'bg-slate-900/60 border-white/10 hover:border-cyan-500/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon, Badge, Selection Check */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                            {meta.icon}
                          </span>
                          <div>
                            <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                              {persona.name}
                            </h3>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">
                              {meta.badge}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-[0_0_10px_#22d3ee]">
                            ✓
                          </div>
                        )}
                      </div>

                      {/* System Prompt Snippet */}
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-2 font-sans">
                        {persona.system_prompt || persona.description || 'General conversational AI voice companion.'}
                      </p>
                    </div>

                    {/* Footer Action */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-slate-500 uppercase">{persona.slug}</span>
                      <span className={`font-mono text-[11px] font-semibold ${isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {isSelected ? 'ACTIVE' : 'ACTIVATE →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: CREATE CUSTOM PERSONA */}
          {view === 'create' && (
            <div className="space-y-4 text-sm font-sans max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="custom-persona-name" className="block text-slate-300 text-xs font-mono mb-1">PERSONA NAME</label>
                  <input
                    id="custom-persona-name"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Socratic Tutor"
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2 text-cyan-300 font-sans focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="custom-persona-slug" className="block text-slate-300 text-xs font-mono mb-1">SLUG (OPTIONAL)</label>
                  <input
                    id="custom-persona-slug"
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="e.g. socratic_tutor"
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="custom-persona-desc" className="block text-slate-300 text-xs font-mono mb-1">SHORT DESCRIPTION</label>
                <input
                  id="custom-persona-desc"
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="e.g. Asks probing questions to guide your understanding"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="custom-persona-prompt" className="text-slate-300 text-xs font-mono">SYSTEM PROMPT / INSTRUCTIONS</label>
                  <span className="text-[10px] font-mono text-slate-500">{customPrompt.length} chars</span>
                </div>
                <textarea
                  id="custom-persona-prompt"
                  rows={6}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="You are a Socratic tutor. Never give direct answers immediately; instead ask guided questions that help the user discover the solution..."
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 text-cyan-100 font-sans focus:outline-none focus:border-cyan-400 text-xs leading-relaxed custom-scrollbar resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setView('list')}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustom}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save & Activate'}
                </button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">
              Stored in <code className="text-cyan-300">cli/templates/*.yaml</code>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


