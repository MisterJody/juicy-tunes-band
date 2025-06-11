import { v4 as uuidv4 } from 'uuid';
import { Agent, Task, TaskStatus, AgentMessage } from './types';

/**
 * Base agent implementation that provides common functionality
 * for all agents in the system.
 */
export abstract class BaseAgent implements Agent {
  id: string;
  name: string;
  description: string;
  protected tasks: Map<string, Task> = new Map();
  protected messageHandlers: Map<string, (message: AgentMessage) => Promise<void>> = new Map();
  protected isInitialized: boolean = false;
  
  constructor(name: string, description: string) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
  }
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log(`Agent ${this.name} already initialized`);
      return;
    }
    
    console.log(`Initializing agent: ${this.name}`);
    await this.registerMessageHandlers();
    this.isInitialized = true;
    console.log(`Agent ${this.name} initialized successfully`);
  }
  
  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.log(`Agent ${this.name} not initialized`);
      return;
    }
    
    console.log(`Shutting down agent: ${this.name}`);
    await this.unregisterMessageHandlers();
    this.isInitialized = false;
    console.log(`Agent ${this.name} shut down successfully`);
  }
  
  /**
   * Create a new task
   */
  protected createTask(type: string): Task {
    const task: Task = {
      id: uuidv4(),
      agentId: this.id,
      type,
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tasks.set(task.id, task);
    return task;
  }
  
  /**
   * Update a task's status and progress
   */
  protected updateTask(taskId: string, status: TaskStatus, progress: number, result?: any, error?: Error): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return null;
    }
    
    task.status = status;
    task.progress = progress;
    task.updatedAt = new Date();
    
    if (result !== undefined) {
      task.result = result;
    }
    
    if (error) {
      task.error = error;
    }
    
    this.tasks.set(taskId, task);
    return task;
  }
  
  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) || null;
  }
  
  /**
   * Get all tasks for this agent
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Send a message to another agent
   */
  protected async sendMessage(toAgentId: string, type: string, payload: any): Promise<string> {
    const message: AgentMessage = {
      id: uuidv4(),
      fromAgentId: this.id,
      toAgentId,
      type,
      payload,
      timestamp: new Date()
    };
    
    // In a real implementation, this would use a message bus or event system
    // For now, we'll use the AgentRegistry to route messages
    await AgentRegistry.routeMessage(message);
    
    return message.id;
  }
  
  /**
   * Handle an incoming message
   */
  async receiveMessage(message: AgentMessage): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    if (!handler) {
      console.warn(`No handler registered for message type: ${message.type}`);
      return;
    }
    
    try {
      await handler(message);
    } catch (error) {
      console.error(`Error handling message ${message.id} of type ${message.type}:`, error);
    }
  }
  
  /**
   * Register message handlers - to be implemented by subclasses
   */
  protected abstract registerMessageHandlers(): Promise<void>;
  
  /**
   * Unregister message handlers - to be implemented by subclasses
   */
  protected abstract unregisterMessageHandlers(): Promise<void>;
}

/**
 * Simple registry to keep track of all agents and route messages
 */
export class AgentRegistry {
  private static agents: Map<string, Agent> = new Map();
  
  /**
   * Register an agent
   */
  static registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    console.log(`Agent registered: ${agent.name} (${agent.id})`);
  }
  
  /**
   * Unregister an agent
   */
  static unregisterAgent(agentId: string): void {
    if (this.agents.has(agentId)) {
      const agent = this.agents.get(agentId)!;
      this.agents.delete(agentId);
      console.log(`Agent unregistered: ${agent.name} (${agent.id})`);
    }
  }
  
  /**
   * Get an agent by ID
   */
  static getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all registered agents
   */
  static getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Route a message to the appropriate agent
   */
  static async routeMessage(message: AgentMessage): Promise<void> {
    const targetAgent = this.agents.get(message.toAgentId);
    if (!targetAgent) {
      console.error(`Target agent ${message.toAgentId} not found for message ${message.id}`);
      return;
    }
    
    await (targetAgent as BaseAgent).receiveMessage(message);
  }
}