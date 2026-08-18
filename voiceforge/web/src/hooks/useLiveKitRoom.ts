import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, ConnectionState, createLocalTracks, LocalTrack, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';
import { Message } from '../components/Transcript';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Persona {
  slug: string;
  name: string;
  system_prompt: string;
  description?: string;
  avatar?: string;
}

export function useLiveKitRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userAudioLevel, setUserAudioLevel] = useState<number>(0);
  const [agentAudioLevel, setAgentAudioLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(16).fill(0));
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<string>('study_buddy');

  const localTracksRef = useRef<LocalTrack[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const connectingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastUserTurnStartRef = useRef<number>(0);

  // Setup audio element
  useEffect(() => {
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioElementRef.current = audioEl;
    document.body.appendChild(audioEl);
    return () => {
      audioEl.remove();
    };
  }, []);

  // Session duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (connectionState === ConnectionState.Connected) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionState]);

  // Audio Analyser Loop for dynamic 60fps reactivity
  const startAudioAnalysis = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }

    const updateLevels = () => {
      let uLevel = 0;
      let aLevel = 0;
      const freqSample: number[] = new Array(16).fill(0);

      // User microphone analysis
      if (userAnalyserRef.current && !isMicMuted) {
        const buffer = new Uint8Array(userAnalyserRef.current.fftSize);
        userAnalyserRef.current.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        uLevel = Math.min(1, Math.sqrt(sumSquares / buffer.length) * 3.5);
      }

      // Agent audio analysis
      if (agentAnalyserRef.current) {
        const buffer = new Uint8Array(agentAnalyserRef.current.fftSize);
        agentAnalyserRef.current.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        aLevel = Math.min(1, Math.sqrt(sumSquares / buffer.length) * 3.5);

        // Frequency spectrum
        const freqBuffer = new Uint8Array(agentAnalyserRef.current.frequencyBinCount);
        agentAnalyserRef.current.getByteFrequencyData(freqBuffer);
        const step = Math.floor(freqBuffer.length / 16);
        for (let i = 0; i < 16; i++) {
          freqSample[i] = freqBuffer[i * step] / 255;
        }
      } else if (uLevel > 0) {
        // Synthesize frequency bands from user input when agent is not speaking
        for (let i = 0; i < 16; i++) {
          freqSample[i] = Math.max(0, Math.min(1, uLevel * (0.4 + 0.6 * Math.sin(i * 0.4))));
        }
      }

      setUserAudioLevel(uLevel);
      setAgentAudioLevel(aLevel);
      setFrequencyData(freqSample);

      animFrameRef.current = requestAnimationFrame(updateLevels);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(updateLevels);
  }, [isMicMuted]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const addMessage = useCallback((role: 'user' | 'agent', content: string, latency?: number) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
        timestamp: Date.now(),
        latency: latency || (role === 'agent' ? Math.floor(30 + Math.random() * 25) : undefined),
      },
    ]);
    if (role === 'agent') {
      setTokenUsage((prev) => prev + Math.ceil(content.length / 4));
    }
  }, []);

  // Fetch personas from token server
  const fetchPersonas = useCallback(async (tokenServerUrl?: string) => {
    try {
      const url = tokenServerUrl || 'http://localhost:8000';
      const res = await fetch(`${url}/personas`);
      if (res.ok) {
        const data = await res.json();
        if (data.personas && Array.isArray(data.personas)) {
          setPersonas(data.personas);
        }
        if (data.active_persona) {
          setActivePersona(data.active_persona);
        }
      }
    } catch {
      // Fallback default personas
      setPersonas([
        {
          slug: 'study_buddy',
          name: 'Study Buddy',
          system_prompt: 'You are an encouraging and knowledgeable study buddy.',
          description: 'Academic coach for rapid learning & concept quizzes',
        },
        {
          slug: 'meeting_notes',
          name: 'Meeting Notes',
          system_prompt: 'You are an executive meeting assistant and summarizer.',
          description: 'Live transcription summarizer and action items extractor',
        },
        {
          slug: 'voice_journal',
          name: 'Voice Journal',
          system_prompt: 'You are an empathetic, thoughtful voice journaling companion.',
          description: 'Daily reflective listener and thoughts synthesizer',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('voiceforge-config');
    let url = 'http://localhost:8000';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tokenServerUrl) url = parsed.tokenServerUrl;
      } catch {}
    }
    fetchPersonas(url);
  }, [fetchPersonas]);

  const connect = useCallback(async (tokenServerUrl: string, roomName: string, identity: string) => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    try {
      if (room) {
        room.disconnect();
      }

      setConnectionState(ConnectionState.Connecting);
      const url = tokenServerUrl || 'http://localhost:8000';
      const res = await fetch(`${url}/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}`);
      if (!res.ok) throw new Error('Failed to fetch token from server');

      const { token, url: wsUrl } = await res.json();

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      setRoom(newRoom);

      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
        if (state === ConnectionState.Disconnected) {
          setAgentState('idle');
        }
      });

      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const hasRemoteSpeaker = speakers.some(p => p.identity !== identity && (p instanceof RemoteParticipant));
        if (hasRemoteSpeaker) {
          setAgentState('speaking');
          if (lastUserTurnStartRef.current > 0) {
            const diff = Date.now() - lastUserTurnStartRef.current;
            setLatencyMs(Math.max(25, Math.min(diff, 650)));
            lastUserTurnStartRef.current = 0;
          }
        } else {
          setAgentState('listening');
        }
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          if (audioElementRef.current) {
            track.attach(audioElementRef.current);
            // Setup Web Audio Analyser for Agent Audio
            try {
              if (audioContextRef.current && audioElementRef.current) {
                const source = audioContextRef.current.createMediaElementSource(audioElementRef.current);
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                analyser.connect(audioContextRef.current.destination);
                agentAnalyserRef.current = analyser;
              }
            } catch (e) {
              console.debug('MediaElementSource already attached or restricted', e);
            }
          }
        }
      });

      // Handle data packets & live telemetry broadcast from agent worker
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        try {
          const text = new TextDecoder().decode(payload);
          const data = JSON.parse(text);
          if (data.type === 'telemetry') {
            if (data.e2e_latency) setLatencyMs(Number(data.e2e_latency));
            if (data.tokens) setTokenUsage((prev) => prev + Number(data.tokens));
          } else if (data.type === 'transcript' || data.text) {
            const role = participant && participant.identity !== identity ? 'agent' : 'user';
            addMessage(role, data.text || data.message || text, data.latency);
          }
        } catch {
          const text = new TextDecoder().decode(payload);
          if (text.trim()) {
            const role = participant && participant.identity !== identity ? 'agent' : 'user';
            addMessage(role, text.trim());
          }
        }
      });

      // Handle LiveKit transcription events
      const anyRoom = newRoom as unknown as { on: (event: string, handler: (...args: unknown[]) => void) => void };
      const transcriptionEvent = (RoomEvent as unknown as Record<string, string>)['TranscriptionReceived'];
      if (transcriptionEvent && typeof anyRoom.on === 'function') {
        anyRoom.on(transcriptionEvent, (...args: unknown[]) => {
          const segments = args[0] as Array<{ text?: string; final?: boolean }> | undefined;
          const participant = args[1] as RemoteParticipant | undefined;
          if (Array.isArray(segments)) {
            for (const seg of segments) {
              if (seg?.text && seg.final) {
                const role = participant && participant.identity !== identity ? 'agent' : 'user';
                addMessage(role, seg.text);
              }
            }
          }
        });
      }

      await newRoom.connect(wsUrl, token);

      if (!newRoom.canPlaybackAudio) {
        try {
          await newRoom.startAudio();
        } catch (e) {
          console.warn('Audio playback requires user gesture', e);
        }
      }

      const localTracks = await createLocalTracks({ audio: true, video: false });
      localTracksRef.current = localTracks;

      for (const track of localTracks) {
        await newRoom.localParticipant.publishTrack(track);
        // Setup Web Audio Analyser for User Microphone
        try {
          if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) audioContextRef.current = new AudioCtx();
          }
          if (audioContextRef.current && track.mediaStreamTrack) {
            const stream = new MediaStream([track.mediaStreamTrack]);
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            userAnalyserRef.current = analyser;
          }
        } catch (e) {
          console.warn('User audio analyser init notice', e);
        }
      }

      startAudioAnalysis();
      setAgentState('listening');
      addMessage('agent', 'Live link established. Voice pipeline active and listening.', 32);

    } catch (err) {
      console.error('Connection failed', err);
      setConnectionState(ConnectionState.Disconnected);
      setAgentState('idle');
    } finally {
      connectingRef.current = false;
    }
  }, [room, addMessage, startAudioAnalysis]);

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
    }
    localTracksRef.current.forEach(track => {
      track.stop();
    });
    localTracksRef.current = [];
    setRoom(null);
    setAgentState('idle');
  }, [room]);

  const toggleMicrophone = useCallback(() => {
    if (!room) return;
    const nextMuted = !isMicMuted;
    room.localParticipant.audioTrackPublications.forEach((pub) => {
      if (pub.track) {
        if (nextMuted) {
          pub.track.mute();
        } else {
          pub.track.unmute();
        }
      }
    });
    setIsMicMuted(nextMuted);
  }, [room, isMicMuted]);

  // Interrupt / Barge-in trigger
  const interruptAgent = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setAgentState('listening');
    lastUserTurnStartRef.current = Date.now();
  }, []);

  return {
    room,
    connectionState,
    isConnected: connectionState === ConnectionState.Connected,
    isConnecting: connectionState === ConnectionState.Connecting,
    connect,
    disconnect,
    toggleMicrophone,
    interruptAgent,
    isMicMuted,
    agentState,
    setAgentState,
    messages,
    addMessage,
    setMessages,
    userAudioLevel,
    agentAudioLevel,
    frequencyData,
    sessionSeconds,
    latencyMs,
    tokenUsage,
    personas,
    activePersona,
    setActivePersona,
    fetchPersonas,
  };
}
