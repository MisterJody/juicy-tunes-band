import { useCallback } from 'react';
import { WorkerInput } from './types';
import { useWorkerManager } from './workerManager';

export const useAudioProcessor = () => {
  const { createWorker, sendToWorker, handleWorkerMessage, handleWorkerError } = useWorkerManager();

  const processAudioFile = useCallback(async (
    songId: string,
    audioUrl: string,
    onComplete: (songId: string) => void
  ) => {
    console.log('Starting background analysis for song:', songId);
    
    try {
      // Fetch the audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Create audio context and decode
      const audioContext = new (window.AudioContext || ((window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext))();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('Audio loaded for analysis:', {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels
      });
      
      // Extract audio data for the worker
      const audioData = audioBuffer.getChannelData(0);
      const audioDataArray = new Float32Array(audioData);
      
      // Create Web Worker for analysis
      const worker = createWorker();
      
      // Prepare worker input
      const workerInput: WorkerInput = {
        audioData: audioDataArray,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        numberOfChannels: audioBuffer.numberOfChannels,
        songId
      };
      
      // Send audio data to worker
      sendToWorker(worker, workerInput);
      
      // Listen for worker results
      worker.onmessage = (e) => handleWorkerMessage(e, worker, onComplete);
      
      worker.onerror = (error) => handleWorkerError(error, worker, songId, onComplete);
      
      // Set a timeout to prevent infinite analysis
      setTimeout(() => {
        worker.terminate();
        onComplete(songId);
        console.log('Analysis timeout for song:', songId);
      }, 60000); // 1 minute timeout
      
      await audioContext.close();
      
    } catch (error) {
      console.error('Audio analysis failed:', error);
      onComplete(songId);
    }
  }, [createWorker, sendToWorker, handleWorkerMessage, handleWorkerError]);

  return { processAudioFile };
};
