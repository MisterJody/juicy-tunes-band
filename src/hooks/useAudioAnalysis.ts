
import { useState, useEffect, useCallback } from 'react';
import { Song } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { useWorkerProcessor } from './audioAnalysis/workerProcessor';
import { useQueueManager } from './audioAnalysis/queueManager';
import { filterUnanalyzedSongs, createAnalyzingSongsManager } from './audioAnalysis/utils';

export const useAudioAnalysis = () => {
  const [analyzingSongs, setAnalyzingSongs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { processAudioFile } = useWorkerProcessor();
  const {
    analysisQueue,
    isProcessingQueue,
    analysisProgress,
    addToQueue,
    clearQueue,
    updateProgress,
    startProcessing
  } = useQueueManager();

  const { addSong, removeSong } = createAnalyzingSongsManager();

  const handleAnalysisComplete = useCallback((songId: string) => {
    setAnalyzingSongs(prev => removeSong(prev, songId));
  }, [removeSong]);

  const analyzeAudioFile = useCallback(async (songId: string, audioUrl: string) => {
    setAnalyzingSongs(prev => addSong(prev, songId));
    await processAudioFile(songId, audioUrl, handleAnalysisComplete);
  }, [processAudioFile, handleAnalysisComplete, addSong]);

  const processAnalysisQueue = useCallback(async () => {
    if (isProcessingQueue || analysisQueue.length === 0) return;
    
    startProcessing();
    updateProgress(0, analysisQueue.length);
    console.log('Starting to process analysis queue with', analysisQueue.length, 'songs using Web Worker');
    
    try {
      // Process songs one by one
      for (let i = 0; i < analysisQueue.length; i++) {
        const song = analysisQueue[i];
        
        if (song.audioFile && !analyzingSongs.has(song.id)) {
          console.log(`Processing analysis queue: ${i + 1}/${analysisQueue.length} - ${song.title}`);
          
          // Update progress
          updateProgress(i, analysisQueue.length);
          
          // Start analysis and wait for it to complete
          await analyzeAudioFile(song.id, song.audioFile);
          
          // Wait for the analysis to actually complete
          while (analyzingSongs.has(song.id)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Small delay between songs
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Mark as complete
      updateProgress(analysisQueue.length, analysisQueue.length);
    } catch (error) {
      console.error('Error processing analysis queue:', error);
    } finally {
      clearQueue();
      console.log('Web Worker analysis queue processing complete');
    }
  }, [isProcessingQueue, analysisQueue, analyzingSongs, analyzeAudioFile, startProcessing, updateProgress, clearQueue]);

  const startAnalysis = useCallback((song: Song) => {
    if (song.audioFile && !analyzingSongs.has(song.id)) {
      console.log('Starting individual Web Worker analysis for:', song.title);
      
      // If currently processing queue, add to queue
      if (isProcessingQueue) {
        addToQueue([song]);
        console.log('Added to queue during batch processing');
      } else {
        // Start analysis immediately with a short delay
        setTimeout(() => analyzeAudioFile(song.id, song.audioFile), 1000);
      }
    }
  }, [analyzingSongs, isProcessingQueue, analyzeAudioFile, addToQueue]);

  const startBatchAnalysis = useCallback((songs: Song[]) => {
    const songsToAnalyze = filterUnanalyzedSongs(songs, analyzingSongs);
    
    if (songsToAnalyze.length > 0) {
      console.log('Starting batch Web Worker analysis for', songsToAnalyze.length, 'songs');
      addToQueue(songsToAnalyze);
      
      toast({
        title: "Album analysis started",
        description: `${songsToAnalyze.length} songs queued for Web Worker analysis`,
      });
    }
  }, [analyzingSongs, toast, addToQueue]);

  const analyzeExistingSongs = useCallback((songs: Song[]) => {
    // Find songs that haven't been analyzed yet (no tempo or key)
    const unanalyzedSongs = filterUnanalyzedSongs(songs, analyzingSongs);
    
    if (unanalyzedSongs.length > 0) {
      console.log('Found', unanalyzedSongs.length, 'existing songs to analyze with Web Worker');
      addToQueue(unanalyzedSongs);
      
      toast({
        title: "Analyzing existing songs",
        description: `${unanalyzedSongs.length} songs found without analysis data`,
      });
    }
  }, [analyzingSongs, toast, addToQueue]);

  // Auto-process queue when it gets populated
  useEffect(() => {
    if (analysisQueue.length > 0 && !isProcessingQueue) {
      console.log('Auto-starting Web Worker queue processing for', analysisQueue.length, 'songs');
      const timer = setTimeout(processAnalysisQueue, 1000);
      return () => clearTimeout(timer);
    }
  }, [analysisQueue.length, isProcessingQueue, processAnalysisQueue]);

  return {
    analyzingSongs,
    analysisQueue: analysisQueue.length,
    isProcessingQueue,
    analysisProgress,
    startAnalysis,
    startBatchAnalysis,
    analyzeExistingSongs
  };
};
