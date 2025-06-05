
import { useState, useCallback } from 'react';
import { Song } from '@/pages/Index';
import { AnalysisProgress } from './types';

export const useQueueManager = () => {
  const [analysisQueue, setAnalysisQueue] = useState<Song[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({ current: 0, total: 0 });

  const addToQueue = useCallback((songs: Song[]) => {
    setAnalysisQueue(prev => [...prev, ...songs]);
  }, []);

  const clearQueue = useCallback(() => {
    setAnalysisQueue([]);
    setIsProcessingQueue(false);
    // Reset progress after a delay
    setTimeout(() => setAnalysisProgress({ current: 0, total: 0 }), 3000);
  }, []);

  const updateProgress = useCallback((current: number, total: number) => {
    setAnalysisProgress({ current, total });
  }, []);

  const startProcessing = useCallback(() => {
    setIsProcessingQueue(true);
  }, []);

  return {
    analysisQueue,
    isProcessingQueue,
    analysisProgress,
    addToQueue,
    clearQueue,
    updateProgress,
    startProcessing
  };
};
