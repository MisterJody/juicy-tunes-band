/**
 * Base Agent interface that all agents must implement
 */
export interface Agent {
  /**
   * Unique identifier for the agent
   */
  id: string;
  
  /**
   * Human-readable name of the agent
   */
  name: string;
  
  /**
   * Description of the agent's responsibilities
   */
  description: string;
  
  /**
   * Initialize the agent with any required configuration
   */
  initialize: () => Promise<void>;
  
  /**
   * Shutdown the agent and clean up any resources
   */
  shutdown: () => Promise<void>;
}

/**
 * Status of an agent task
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Task interface for tracking agent operations
 */
export interface Task {
  id: string;
  agentId: string;
  type: string;
  status: TaskStatus;
  progress: number;
  result?: any;
  error?: Error;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message interface for agent communication
 */
export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: string;
  payload: any;
  timestamp: Date;
}