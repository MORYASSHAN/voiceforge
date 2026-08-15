/**
 * Type definitions for VoiceForge Web Application
 */

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface PersonaConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  voice: {
    provider: 'cartesia' | 'elevenlabs' | 'openai' | 'deepgram';
    voiceId: string;
    speed?: number;
    emotion?: string[];
  };
  accentColor: string;
  avatarIcon: string;
}

export interface VoiceForgeConfig {
  livekitUrl: string;
  tokenServerUrl: string;
  roomName: string;
  participantName: string;
  activePersonaId: string;
  selectedMicDeviceId?: string;
  selectedSpeakerDeviceId?: string;
  apiKeys: {
    openai?: string;
    groq?: string;
    anthropic?: string;
    deepgram?: string;
    cartesia?: string;
    elevenlabs?: string;
  };
  autoConnect?: boolean;
}

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string | number;
  isFinal?: boolean;
  durationMs?: number;
}

export type LiveKitConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';
