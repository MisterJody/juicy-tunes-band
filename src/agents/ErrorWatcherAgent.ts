import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';

/**
 * Error interface for tracking errors
 */
interface ErrorRecord {
  id: string;
  agentId: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context?: any;
  resolved: boolean;
  retryCount: number;
}

/**
 * ErrorWatcherAgent monitors and handles errors across the system
 */
export class ErrorWatcherAgent extends BaseAgent {
  private errors: Map<string, ErrorRecord> = new Map();
  private errorListeners: Set<(error: ErrorRecord) => void> = new Set();
  
  constructor() {
    super(
      'ErrorWatcherAgent',
      'Detects and logs errors, retries actions, provides user feedback'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('error:report', this.handleErrorReport.bind(this));
    this.messageHandlers.set('error:resolve', this.handleErrorResolve.bind(this));
    this.messageHandlers.set('error:retry', this.handleErrorRetry.bind(this));
    this.messageHandlers.set('error:get_all', this.handleGetAllErrors.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
  }
  
  /**
   * Handle error report message
   */
  private async handleErrorReport(message: AgentMessage): Promise<void> {
    const { error, context } = message.payload;
    const taskId = this.createTask('error:report').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Create an error record
      const errorRecord: ErrorRecord = {
        id: taskId,
        agentId: message.fromAgentId,
        message: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date(),
        context,
        resolved: false,
        retryCount: 0
      };
      
      // Store the error
      this.errors.set(errorRecord.id, errorRecord);
      
      // Notify listeners
      this.notifyErrorListeners(errorRecord);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, errorRecord);
      
      // Notify the original requester that the error is recorded
      await this.sendMessage(
        message.fromAgentId,
        'error:report:completed',
        { errorId: errorRecord.id }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that recording the error failed
      await this.sendMessage(
        message.fromAgentId,
        'error:report:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle error resolve message
   */
  private async handleErrorResolve(message: AgentMessage): Promise<void> {
    const { errorId } = message.payload;
    const taskId = this.createTask(`error:resolve:${errorId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Check if the error exists
      if (!this.errors.has(errorId)) {
        throw new Error(`Error with ID ${errorId} not found`);
      }
      
      // Mark the error as resolved
      const errorRecord = this.errors.get(errorId)!;
      errorRecord.resolved = true;
      this.errors.set(errorId, errorRecord);
      
      // Notify listeners
      this.notifyErrorListeners(errorRecord);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, errorRecord);
      
      // Notify the original requester that the error is resolved
      await this.sendMessage(
        message.fromAgentId,
        'error:resolve:completed',
        { errorId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that resolving the error failed
      await this.sendMessage(
        message.fromAgentId,
        'error:resolve:failed',
        { errorId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle error retry message
   */
  private async handleErrorRetry(message: AgentMessage): Promise<void> {
    const { errorId } = message.payload;
    const taskId = this.createTask(`error:retry:${errorId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Check if the error exists
      if (!this.errors.has(errorId)) {
        throw new Error(`Error with ID ${errorId} not found`);
      }
      
      // Get the error record
      const errorRecord = this.errors.get(errorId)!;
      
      // Increment the retry count
      errorRecord.retryCount += 1;
      this.errors.set(errorId, errorRecord);
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Notify the original agent that caused the error to retry the operation
      await this.sendMessage(
        errorRecord.agentId,
        'error:retry:request',
        { errorId, context: errorRecord.context }
      );
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, errorRecord);
      
      // Notify the original requester that the retry request is sent
      await this.sendMessage(
        message.fromAgentId,
        'error:retry:completed',
        { errorId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that retrying the error failed
      await this.sendMessage(
        message.fromAgentId,
        'error:retry:failed',
        { errorId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle get all errors message
   */
  private async handleGetAllErrors(message: AgentMessage): Promise<void> {
    const taskId = this.createTask('error:get_all').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get all errors
      const errors = Array.from(this.errors.values());
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, errors);
      
      // Notify the original requester with the errors
      await this.sendMessage(
        message.fromAgentId,
        'error:get_all:completed',
        { errors }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that getting the errors failed
      await this.sendMessage(
        message.fromAgentId,
        'error:get_all:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Notify error listeners
   */
  private notifyErrorListeners(error: ErrorRecord): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    }
  }
  
  /**
   * Add an error listener
   */
  addErrorListener(listener: (error: ErrorRecord) => void): () => void {
    this.errorListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.errorListeners.delete(listener);
    };
  }
  
  /**
   * Report an error
   */
  reportError(error: Error, context?: any): string {
    const errorRecord: ErrorRecord = {
      id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId: this.id,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context,
      resolved: false,
      retryCount: 0
    };
    
    // Store the error
    this.errors.set(errorRecord.id, errorRecord);
    
    // Notify listeners
    this.notifyErrorListeners(errorRecord);
    
    return errorRecord.id;
  }
  
  /**
   * Resolve an error
   */
  resolveError(errorId: string): boolean {
    if (!this.errors.has(errorId)) {
      return false;
    }
    
    // Mark the error as resolved
    const errorRecord = this.errors.get(errorId)!;
    errorRecord.resolved = true;
    this.errors.set(errorId, errorRecord);
    
    // Notify listeners
    this.notifyErrorListeners(errorRecord);
    
    return true;
  }
  
  /**
   * Get all errors
   */
  getAllErrors(): ErrorRecord[] {
    return Array.from(this.errors.values());
  }
  
  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ErrorRecord[] {
    return Array.from(this.errors.values()).filter(error => !error.resolved);
  }
}