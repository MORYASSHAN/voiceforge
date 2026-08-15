import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, ConnectionState, createLocalTracks, LocalTrack, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function useLiveKitRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  
  const localTracksRef = useRef<LocalTrack[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioElementRef.current = audioEl;
    document.body.appendChild(audioEl);
    return () => {
      audioEl.remove();
    };
  }, []);

  const connect = useCallback(async (tokenServerUrl: string, roomName: string, identity: string) => {
    try {
      if (room) {
        room.disconnect();
      }

      const url = tokenServerUrl || 'http://localhost:8000';
      const res = await fetch(`${url}/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}`);
      if (!res.ok) throw new Error('Failed to fetch token');
      
      const { token, url: wsUrl } = await res.json();
      
      const newRoom = new Room();
      setRoom(newRoom);
      
      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const hasRemoteSpeaker = speakers.some(p => p.identity !== identity && (p instanceof RemoteParticipant));
        if (hasRemoteSpeaker) {
          setAgentState('speaking');
        } else {
          setAgentState('listening');
        }
      });
      
      newRoom.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          if (audioElementRef.current) {
            track.attach(audioElementRef.current);
          }
        }
      });

      await newRoom.connect(wsUrl, token);
      
      const localTracks = await createLocalTracks({ audio: true, video: false });
      localTracksRef.current = localTracks;
      
      for (const track of localTracks) {
        await newRoom.localParticipant.publishTrack(track);
      }
      
      setAgentState('listening');
      
    } catch (err) {
      console.error('Connection failed', err);
      setConnectionState(ConnectionState.Disconnected);
    }
  }, [room]);

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
    agentState
  };
}
