
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2 } from 'lucide-react';

interface AnalysisProgressIndicatorProps {
  isProcessing: boolean;
  progress: { current: number; total: number };
  analyzingSongs: Set<string>;
}

export const AnalysisProgressIndicator = ({ 
  isProcessing, 
  progress, 
  analyzingSongs 
}: AnalysisProgressIndicatorProps) => {
  if (!isProcessing && progress.total === 0 && analyzingSongs.size === 0) {
    return null;
  }

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const isComplete = progress.current === progress.total && progress.total > 0;

  return (
    <div className="fixed top-20 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm z-40 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Music className="w-4 h-4 text-white" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            {isComplete ? 'Analysis Complete' : 'Analyzing Audio'}
          </h3>
          <p className="text-xs text-gray-400">
            {progress.total > 0 
              ? `${progress.current} of ${progress.total} songs`
              : `${analyzingSongs.size} song${analyzingSongs.size !== 1 ? 's' : ''} processing`
            }
          </p>
        </div>
      </div>
      
      {progress.total > 0 && (
        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className="h-2 bg-gray-800"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{Math.round(percentage)}% complete</span>
            <span>{progress.current}/{progress.total}</span>
          </div>
        </div>
      )}
      
      {analyzingSongs.size > 0 && progress.total === 0 && (
        <div className="text-xs text-gray-400">
          Individual song analysis in progress...
        </div>
      )}
    </div>
  );
};
