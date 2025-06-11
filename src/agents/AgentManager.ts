import { AgentRegistry } from './BaseAgent';
import { UploadAgent } from './UploadAgent';
import { AudioProcessingAgent } from './AudioProcessingAgent';
import { MetadataAgent } from './MetadataAgent';
import { LyricsAgent } from './LyricsAgent';
import { SetlistAgent } from './SetlistAgent';
import { UIAgent } from './UIAgent';
import { RealtimeAgent } from './RealtimeAgent';
import { ErrorWatcherAgent } from './ErrorWatcherAgent';

/**
 * AgentManager handles initialization and access to all agents
 */
export class AgentManager {
  private static instance: AgentManager;
  
  private uploadAgent: UploadAgent;
  private audioProcessingAgent: AudioProcessingAgent;
  private metadataAgent: MetadataAgent;
  private lyricsAgent: LyricsAgent;
  private setlistAgent: SetlistAgent;
  private uiAgent: UIAgent;
  private realtimeAgent: RealtimeAgent;
  private errorWatcherAgent: ErrorWatcherAgent;
  
  private initialized: boolean = false;
  
  private constructor() {
    // Create all agents
    this.uploadAgent = new UploadAgent();
    this.audioProcessingAgent = new AudioProcessingAgent();
    this.metadataAgent = new MetadataAgent();
    this.lyricsAgent = new LyricsAgent();
    this.setlistAgent = new SetlistAgent();
    this.uiAgent = new UIAgent();
    this.realtimeAgent = new RealtimeAgent();
    this.errorWatcherAgent = new ErrorWatcherAgent();
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    
    return AgentManager.instance;
  }
  
  /**
   * Initialize all agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('AgentManager already initialized');
      return;
    }
    
    console.log('Initializing AgentManager...');
    
    // Register all agents
    AgentRegistry.registerAgent(this.uploadAgent);
    AgentRegistry.registerAgent(this.audioProcessingAgent);
    AgentRegistry.registerAgent(this.metadataAgent);
    AgentRegistry.registerAgent(this.lyricsAgent);
    AgentRegistry.registerAgent(this.setlistAgent);
    AgentRegistry.registerAgent(this.uiAgent);
    AgentRegistry.registerAgent(this.realtimeAgent);
    AgentRegistry.registerAgent(this.errorWatcherAgent);
    
    // Initialize all agents
    await this.errorWatcherAgent.initialize(); // Initialize error watcher first
    await this.uploadAgent.initialize();
    await this.audioProcessingAgent.initialize();
    await this.metadataAgent.initialize();
    await this.lyricsAgent.initialize();
    await this.setlistAgent.initialize();
    await this.uiAgent.initialize();
    await this.realtimeAgent.initialize();
    
    this.initialized = true;
    console.log('AgentManager initialized successfully');
  }
  
  /**
   * Shutdown all agents
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      console.log('AgentManager not initialized');
      return;
    }
    
    console.log('Shutting down AgentManager...');
    
    // Shutdown all agents in reverse order
    await this.realtimeAgent.shutdown();
    await this.uiAgent.shutdown();
    await this.setlistAgent.shutdown();
    await this.lyricsAgent.shutdown();
    await this.metadataAgent.shutdown();
    await this.audioProcessingAgent.shutdown();
    await this.uploadAgent.shutdown();
    await this.errorWatcherAgent.shutdown(); // Shutdown error watcher last
    
    // Unregister all agents
    AgentRegistry.unregisterAgent(this.realtimeAgent.id);
    AgentRegistry.unregisterAgent(this.uiAgent.id);
    AgentRegistry.unregisterAgent(this.setlistAgent.id);
    AgentRegistry.unregisterAgent(this.lyricsAgent.id);
    AgentRegistry.unregisterAgent(this.metadataAgent.id);
    AgentRegistry.unregisterAgent(this.audioProcessingAgent.id);
    AgentRegistry.unregisterAgent(this.uploadAgent.id);
    AgentRegistry.unregisterAgent(this.errorWatcherAgent.id);
    
    this.initialized = false;
    console.log('AgentManager shut down successfully');
  }
  
  /**
   * Get the upload agent
   */
  getUploadAgent(): UploadAgent {
    return this.uploadAgent;
  }
  
  /**
   * Get the audio processing agent
   */
  getAudioProcessingAgent(): AudioProcessingAgent {
    return this.audioProcessingAgent;
  }
  
  /**
   * Get the metadata agent
   */
  getMetadataAgent(): MetadataAgent {
    return this.metadataAgent;
  }
  
  /**
   * Get the lyrics agent
   */
  getLyricsAgent(): LyricsAgent {
    return this.lyricsAgent;
  }
  
  /**
   * Get the setlist agent
   */
  getSetlistAgent(): SetlistAgent {
    return this.setlistAgent;
  }
  
  /**
   * Get the UI agent
   */
  getUIAgent(): UIAgent {
    return this.uiAgent;
  }
  
  /**
   * Get the realtime agent
   */
  getRealtimeAgent(): RealtimeAgent {
    return this.realtimeAgent;
  }
  
  /**
   * Get the error watcher agent
   */
  getErrorWatcherAgent(): ErrorWatcherAgent {
    return this.errorWatcherAgent;
  }
  
  /**
   * Check if the agent manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}