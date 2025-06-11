import { useState, useEffect } from 'react';
import { AgentManager } from '@/agents/AgentManager';
import { UploadAgent } from '@/agents/UploadAgent';
import { AudioProcessingAgent } from '@/agents/AudioProcessingAgent';
import { MetadataAgent } from '@/agents/MetadataAgent';
import { LyricsAgent } from '@/agents/LyricsAgent';
import { SetlistAgent } from '@/agents/SetlistAgent';
import { UIAgent } from '@/agents/UIAgent';
import { RealtimeAgent } from '@/agents/RealtimeAgent';
import { ErrorWatcherAgent } from '@/agents/ErrorWatcherAgent';

/**
 * Hook to access the agent system
 */
export const useAgents = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize the agent system
  useEffect(() => {
    const initializeAgents = async () => {
      try {
        setIsInitializing(true);
        const agentManager = AgentManager.getInstance();
        
        if (!agentManager.isInitialized()) {
          await agentManager.initialize();
        }
        
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing agents:', err);
        setError(err as Error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeAgents();
    
    // Cleanup on unmount
    return () => {
      // We don't shut down the agents on component unmount
      // because they should persist for the lifetime of the app
      // AgentManager.getInstance().shutdown();
    };
  }, []);
  
  // Get the agent manager
  const getAgentManager = (): AgentManager => {
    return AgentManager.getInstance();
  };
  
  // Get the upload agent
  const getUploadAgent = (): UploadAgent => {
    return AgentManager.getInstance().getUploadAgent();
  };
  
  // Get the audio processing agent
  const getAudioProcessingAgent = (): AudioProcessingAgent => {
    return AgentManager.getInstance().getAudioProcessingAgent();
  };
  
  // Get the metadata agent
  const getMetadataAgent = (): MetadataAgent => {
    return AgentManager.getInstance().getMetadataAgent();
  };
  
  // Get the lyrics agent
  const getLyricsAgent = (): LyricsAgent => {
    return AgentManager.getInstance().getLyricsAgent();
  };
  
  // Get the setlist agent
  const getSetlistAgent = (): SetlistAgent => {
    return AgentManager.getInstance().getSetlistAgent();
  };
  
  // Get the UI agent
  const getUIAgent = (): UIAgent => {
    return AgentManager.getInstance().getUIAgent();
  };
  
  // Get the realtime agent
  const getRealtimeAgent = (): RealtimeAgent => {
    return AgentManager.getInstance().getRealtimeAgent();
  };
  
  // Get the error watcher agent
  const getErrorWatcherAgent = (): ErrorWatcherAgent => {
    return AgentManager.getInstance().getErrorWatcherAgent();
  };
  
  return {
    isInitialized,
    isInitializing,
    error,
    getAgentManager,
    getUploadAgent,
    getAudioProcessingAgent,
    getMetadataAgent,
    getLyricsAgent,
    getSetlistAgent,
    getUIAgent,
    getRealtimeAgent,
    getErrorWatcherAgent
  };
};