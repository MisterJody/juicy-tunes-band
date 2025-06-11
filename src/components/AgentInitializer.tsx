import { useEffect } from 'react';
import { useAgentContext } from './AgentProvider';

/**
 * Component that initializes the agent system
 * This is loaded lazily to improve initial load time
 */
const AgentInitializer = () => {
  const { isInitialized, isInitializing, agentManager } = useAgentContext();
  
  useEffect(() => {
    const initialize = async () => {
      if (!isInitialized && !isInitializing) {
        try {
          console.log('Initializing agent system...');
          await agentManager.initialize();
          console.log('Agent system initialized successfully');
        } catch (error) {
          console.error('Error initializing agent system:', error);
        }
      }
    };
    
    initialize();
    
    // Cleanup on unmount
    return () => {
      // We don't shut down the agents on component unmount
      // because they should persist for the lifetime of the app
      // agentManager.shutdown();
    };
  }, [isInitialized, isInitializing, agentManager]);
  
  // This component doesn't render anything
  return null;
};

export default AgentInitializer;