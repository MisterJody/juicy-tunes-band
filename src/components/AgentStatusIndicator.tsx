import React from 'react';
import { useAgentContext } from './AgentProvider';

/**
 * Component that displays the status of the agent system
 */
export const AgentStatusIndicator: React.FC = () => {
  const { isInitialized, isInitializing, error } = useAgentContext();
  
  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
        <div className="font-bold">Agent System Error</div>
        <div className="text-sm">{error.message}</div>
      </div>
    );
  }
  
  if (isInitializing) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
        <div className="font-bold">Initializing Agent System</div>
        <div className="text-sm">Please wait...</div>
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
        <div className="font-bold">Agent System Not Initialized</div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 opacity-80 hover:opacity-100 transition-opacity duration-200">
      <div className="font-bold">Agent System Active</div>
      <div className="text-sm">All agents initialized and running</div>
    </div>
  );
};