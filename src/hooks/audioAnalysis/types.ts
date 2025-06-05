
import { Song } from '@/pages/Index';

export interface AnalysisProgress {
  current: number;
  total: number;
}

export interface WorkerMessage {
  success: boolean;
  songId: string;
  tempo?: number;
  key?: string;
  error?: string;
}

export interface WorkerInput {
  audioData: Float32Array;
  sampleRate: number;
  duration: number;
  numberOfChannels: number;
  songId: string;
}

export interface AnalysisResult {
  tempo: number;
  key: string;
}
