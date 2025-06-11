import React, { createContext, useContext, ReactNode } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { AgentManager } from '@/agents/AgentManager';
import { UploadAgent } from '@/agents/UploadAgent';
import { AudioProcessingAgent } from '@/agents/AudioProcessingAgent';
import { MetadataAgent } from '@/agents/MetadataAgent';
import { LyricsAgent } from '@/agents/LyricsAgent';
import { SetlistAgent } from '@/agents/SetlistAgent';
import { UIAgent } from '@/agents/UIAgent';
import { RealtimeAgent } from '@/agents/RealtimeAgent';
import { ErrorWatcherAgent } from '@/agents/ErrorWatcherAgent';

// Create a context for the agents
interface AgentContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  agentManager: AgentManager;
  uploadAgent: UploadAgent;
  audioProcessingAgent: AudioProcessingAgent;
  metadataAgent: MetadataAgent;
  lyricsAgent: LyricsAgent;
  setlistAgent: SetlistAgent;
  uiAgent: UIAgent;
  realtimeAgent: RealtimeAgent;
  errorWatcherAgent: ErrorWatcherAgent;
}

const AgentContext = createContext<AgentContextType | null>(null);

// Provider component
interface AgentProviderProps {
  children: ReactNode;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const {
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
  } = useAgents();
  
  // Create the context value
  const contextValue: AgentContextType = {
    isInitialized,
    isInitializing,
    error,
    agentManager: getAgentManager(),
    uploadAgent: getUploadAgent(),
    audioProcessingAgent: getAudioProcessingAgent(),
    metadataAgent: getMetadataAgent(),
    lyricsAgent: getLyricsAgent(),
    setlistAgent: getSetlistAgent(),
    uiAgent: getUIAgent(),
    realtimeAgent: getRealtimeAgent(),
    errorWatcherAgent: getErrorWatcherAgent()
  };
  
  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
};

// Hook to use the agents
export const useAgentContext = () => {
  const context = useContext(AgentContext);
  
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  
  return context;
};