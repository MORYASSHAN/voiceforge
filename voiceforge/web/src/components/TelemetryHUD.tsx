import { Persona } from '../hooks/useLiveKitRoom';

interface TelemetryHUDProps {
  isConnected: boolean;
  isConnecting: boolean;
  activePersona: string;
  personas: Persona[];
  sessionSeconds: number;
  latencyMs: number;
  tokenUsage: number;
  colorTheme?: 'cyan' | 'emerald' | 'amber';
  onCycleTheme?: () => void;
  onOpenPersonas: () => void;
  onOpenSettings: () => void;
}

export function TelemetryHUD({
  isConnected,
  isConnecting,
  activePersona,
  personas,
  sessionSeconds,
  latencyMs,
  tokenUsage,
  colorTheme = 'cyan',
  onCycleTheme,
  onOpenPersonas,
  onOpenSettings,
}: TelemetryHUDProps) {
  const currentPersonaObj = personas.find((p) => p.slug === activePersona);
  const personaDisplayName = currentPersonaObj?.name || activePersona.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeBadge = () => {
    if (colorTheme === 'emerald') return { label: 'MATRIX', dot: 'bg-emerald-400' };
    if (colorTheme === 'amber') return { label: 'SOLAR', dot: 'bg-amber-400' };
    return { label: 'CYBER', dot: 'bg-cyan-400' };
  };

  const themeInfo = getThemeBadge();

  return (
    <header className="flex-none px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-white/10 glass-panel backdrop-blur-xl z-20">
      {/* BRAND & LOGO */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)]">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <h1 className="text-base sm:text-lg font-mono font-black tracking-wider text-white">
            VOICE<span className="text-cyan-400">FORGE</span>
          </h1>
          <span className="text-[9px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 hidden sm:inline-block">
            AI STUDIO
          </span>
        </div>
      </div>

      {/* CENTER / RIGHT TELEMETRY PILLS */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* THEME CYCLER BUTTON */}
        {onCycleTheme && (
          <button
            onClick={onCycleTheme}
            title={`Switch Color Theme (Current: ${themeInfo.label})`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 border border-white/10 hover:border-white/25 text-[10px] font-mono text-slate-300 transition-all"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${themeInfo.dot}`} />
            <span className="hidden sm:inline">{themeInfo.label}</span>
          </button>
        )}

        {/* ACTIVE PERSONA SELECTOR PILL */}
        <button
          onClick={onOpenPersonas}
          title="Switch Active Persona"
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all cursor-pointer group"
        >
          <span className="text-sm">🎭</span>
          <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[120px] sm:max-w-[180px]">
            {personaDisplayName}
          </span>
          <svg className="w-3 h-3 text-cyan-400 group-hover:translate-y-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* CONNECTION STATUS */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 font-mono text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                : isConnecting
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span
            className={`font-semibold hidden sm:inline ${
              isConnected
                ? 'text-emerald-400'
                : isConnecting
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          >
            {isConnected ? 'SYS.ONLINE' : isConnecting ? 'SYS.BOOTING' : 'SYS.OFFLINE'}
          </span>
        </div>

        {/* SESSION DURATION & LATENCY METRICS */}
        {isConnected && (
          <div className="hidden lg:flex items-center gap-3 font-mono text-xs text-slate-400 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TIME:</span>
              <span className="text-white font-semibold">{formatDuration(sessionSeconds)}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">LATENCY:</span>
              <span className="text-cyan-400 font-semibold">{latencyMs}ms</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TOKENS:</span>
              <span className="text-purple-400 font-semibold">{tokenUsage}</span>
            </div>
          </div>
        )}

        {/* CONFIG SETTINGS BUTTON */}
        <button
          onClick={onOpenSettings}
          title="Configure connection settings"
          aria-label="Open settings"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </header>
  );
}


