
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkerMessage, WorkerInput } from './types';

export const useWorkerManager = () => {
  const { toast } = useToast();

  const createWorker = useCallback(() => {
    return new Worker('/audioWorker.js');
  }, []);

  const sendToWorker = useCallback((worker: Worker, data: WorkerInput) => {
    worker.postMessage(data);
  }, []);

  const handleWorkerMessage = useCallback(async (
    e: MessageEvent<WorkerMessage>,
    worker: Worker,
    onComplete: (songId: string) => void
  ) => {
    const { success, songId: workerSongId, tempo, key, error } = e.data;
    
    if (success && tempo && key) {
      console.log('Analysis complete:', { tempo, key });
      
      // Update the song in the database
      const { error: dbError } = await supabase
        .from('songs')
        .update({
          tempo: tempo,
          song_key: key
        })
        .eq('id', workerSongId);

      if (dbError) {
        console.error('Error updating song analysis:', dbError);
        toast({
          title: "Analysis update failed",
          description: "Could not save analysis results.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Audio analysis complete",
          description: `Tempo: ${tempo} BPM, Key: ${key}`,
        });
      }
    } else {
      console.error('Worker analysis failed:', error);
      toast({
        title: "Audio analysis failed",
        description: "Could not analyze audio file.",
        variant: "destructive",
      });
    }
    
    // Clean up
    worker.terminate();
    onComplete(workerSongId);
  }, [toast]);

  const handleWorkerError = useCallback((
    error: ErrorEvent,
    worker: Worker,
    songId: string,
    onComplete: (songId: string) => void
  ) => {
    console.error('Worker error:', error);
    toast({
      title: "Audio analysis failed",
      description: "Worker error occurred.",
      variant: "destructive",
    });
    worker.terminate();
    onComplete(songId);
  }, [toast]);

  return {
    createWorker,
    sendToWorker,
    handleWorkerMessage,
    handleWorkerError
  };
};
