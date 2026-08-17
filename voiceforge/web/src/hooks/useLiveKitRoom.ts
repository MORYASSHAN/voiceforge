import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, ConnectionState, createLocalTracks, LocalTrack, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';
import { Message } from '../components/Transcript';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function useLiveKitRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const localTracksRef = useRef<LocalTrack[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioElementRef.current = audioEl;
    document.body.appendChild(audioEl);
    return () => {
      audioEl.remove();
    };
  }, []);

  const addMessage = useCallback((role: 'user' | 'agent', content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const connect = useCallback(async (tokenServerUrl: string, roomName: string, identity: string) => {
    if (connectingRef.current) {
      return;
    }
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
        } else {
          setAgentState('listening');
        }
      });
      
      newRoom.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          if (audioElementRef.current) {
            track.attach(audioElementRef.current);
          }
        }
      });

      // Handle data packets (e.g. transcriptions or status sent over data channel)
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        try {
          const text = new TextDecoder().decode(payload);
          const data = JSON.parse(text);
          if (data.type === 'transcript' || data.text) {
            const role = participant && participant.identity !== identity ? 'agent' : 'user';
            addMessage(role, data.text || data.message || text);
          }
        } catch {
          // Plain text fallback
          const text = new TextDecoder().decode(payload);
          if (text.trim()) {
            const role = participant && participant.identity !== identity ? 'agent' : 'user';
            addMessage(role, text.trim());
          }
        }
      });

      // Handle LiveKit transcription events if emitted
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
      
      // Ensure audio playback works
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
      }
      
      setAgentState('listening');
      addMessage('agent', 'System connected. Listening...');
      
    } catch (err) {
      console.error('Connection failed', err);
      setConnectionState(ConnectionState.Disconnected);
      setAgentState('idle');
    } finally {
      connectingRef.current = false;
    }
  }, [room, addMessage]);

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
    
    room.localParticipant.audioTrackPublications.forEach((pub) => {
      if (pub.track) {
        if (isMicMuted) {
          pub.track.unmute();
        } else {
          pub.track.mute();
        }
      }
    });
    
    setIsMicMuted(!isMicMuted);
  }, [room, isMicMuted]);

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    room,
    connectionState,
    isConnected: connectionState === ConnectionState.Connected,
    isConnecting: connectionState === ConnectionState.Connecting,
    connect,
    disconnect,
    toggleMicrophone,
    isMicMuted,
    agentState,
    messages,
    addMessage,
    setMessages,
  };
}
