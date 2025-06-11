import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWorkerProcessor = () => {
  const { toast } = useToast();

  const processAudioFile = useCallback(async (
    songId: string,
    audioUrl: string,
    onComplete: (songId: string) => void
  ) => {
    console.log('=== Starting Web Worker audio analysis for song ===', songId);
    
    try {
      // Fetch and decode the audio file
      console.log('Fetching audio file from:', audioUrl);
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || ((window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext))();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('=== Audio file loaded successfully ===', {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels
      });
      
      // Use the Web Worker for analysis
      console.log('=== Starting Web Worker analysis ===');
      const workerResult = await analyzeWithWorker(audioBuffer, songId);
      
      console.log('=== Web Worker analysis complete ===', workerResult);
      
      // Update the song in the database
      console.log('=== Updating database ===');
      const { data, error: dbError } = await supabase
        .from('songs')
        .update({
          tempo: workerResult.tempo,
          song_key: workerResult.key
        })
        .eq('id', songId)
        .select();

      if (dbError) {
        console.error('=== Database update failed ===', dbError);
        toast({
          title: "Analysis update failed",
          description: "Could not save analysis results.",
          variant: "destructive",
        });
      } else {
        console.log('=== Database updated successfully ===', data);
        toast({
          title: "Analysis complete",
          description: `Tempo: ${workerResult.tempo} BPM, Key: ${workerResult.key}`,
        });
      }
      
      // Clean up
      await audioContext.close();
      console.log('=== Audio context closed ===');
      
    } catch (error) {
      console.error('=== Web Worker audio analysis failed ===', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the audio file.",
        variant: "destructive",
      });
    } finally {
      console.log('=== Calling onComplete for song ===', songId);
      onComplete(songId);
    }
  }, [toast]);

  return { processAudioFile };
};

// Web Worker analysis function
async function analyzeWithWorker(audioBuffer: AudioBuffer, songId: string): Promise<{ tempo: number; key: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Create the worker
      const worker = new Worker('/audioWorker.js');
      
      // Set up worker message handler
      worker.onmessage = (event) => {
        const { success, tempo, key, error, songId: returnedSongId } = event.data;
        
        console.log('Worker result received:', event.data);
        
        // Verify this is the result for our song
        if (returnedSongId !== songId) {
          console.warn('Received result for different song, ignoring');
          return;
        }
        
        worker.terminate();
        
        if (success) {
          resolve({ tempo, key });
        } else {
          reject(new Error(error || 'Worker analysis failed'));
        }
      };
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        worker.terminate();
        reject(new Error('Worker error occurred'));
      };
      
      // Send audio data to worker
      const audioData = audioBuffer.getChannelData();
      
      console.log('Sending data to worker:', {
        samples: audioData.length,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration
      });
      
      worker.postMessage({
        audioData: audioData,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        numberOfChannels: audioBuffer.numberOfChannels,
        songId: songId
      });
      
      // Set timeout for worker
      setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker analysis timeout'));
      }, 30000); // 30 second timeout
      
    } catch (error) {
      console.error('Worker setup error:', error);
      reject(error);
    }
  });
}
