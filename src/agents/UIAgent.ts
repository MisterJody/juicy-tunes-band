import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';

/**
 * UIAgent handles UI state, transitions, and modals
 */
export class UIAgent extends BaseAgent {
  private modalStack: string[] = [];
  private uiState: Map<string, any> = new Map();
  private stateListeners: Map<string, Set<(value: any) => void>> = new Map();
  
  constructor() {
    super(
      'UIAgent',
      'Handles transitions, modals, and state updates'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('ui:show_modal', this.handleShowModal.bind(this));
    this.messageHandlers.set('ui:hide_modal', this.handleHideModal.bind(this));
    this.messageHandlers.set('ui:set_state', this.handleSetState.bind(this));
    this.messageHandlers.set('ui:get_state', this.handleGetState.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
  }
  
  /**
   * Handle show modal message
   */
  private async handleShowModal(message: AgentMessage): Promise<void> {
    const { modalId, modalProps } = message.payload;
    const taskId = this.createTask(`ui:show_modal:${modalId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Add the modal to the stack
      this.modalStack.push(modalId);
      
      // Set the modal state
      this.setState(`modal:${modalId}`, {
        visible: true,
        props: modalProps
      });
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the modal is shown
      await this.sendMessage(
        message.fromAgentId,
        'ui:show_modal:completed',
        { modalId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that showing the modal failed
      await this.sendMessage(
        message.fromAgentId,
        'ui:show_modal:failed',
        { modalId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle hide modal message
   */
  private async handleHideModal(message: AgentMessage): Promise<void> {
    const { modalId } = message.payload;
    const taskId = this.createTask(`ui:hide_modal:${modalId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Remove the modal from the stack
      this.modalStack = this.modalStack.filter(id => id !== modalId);
      
      // Set the modal state
      this.setState(`modal:${modalId}`, {
        visible: false,
        props: null
      });
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the modal is hidden
      await this.sendMessage(
        message.fromAgentId,
        'ui:hide_modal:completed',
        { modalId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that hiding the modal failed
      await this.sendMessage(
        message.fromAgentId,
        'ui:hide_modal:failed',
        { modalId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle set state message
   */
  private async handleSetState(message: AgentMessage): Promise<void> {
    const { key, value } = message.payload;
    const taskId = this.createTask(`ui:set_state:${key}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Set the state
      this.setState(key, value);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the state is set
      await this.sendMessage(
        message.fromAgentId,
        'ui:set_state:completed',
        { key }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that setting the state failed
      await this.sendMessage(
        message.fromAgentId,
        'ui:set_state:failed',
        { key, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle get state message
   */
  private async handleGetState(message: AgentMessage): Promise<void> {
    const { key } = message.payload;
    const taskId = this.createTask(`ui:get_state:${key}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the state
      const value = this.getState(key);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, value);
      
      // Notify the original requester with the state value
      await this.sendMessage(
        message.fromAgentId,
        'ui:get_state:completed',
        { key, value }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that getting the state failed
      await this.sendMessage(
        message.fromAgentId,
        'ui:get_state:failed',
        { key, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Set a state value and notify listeners
   */
  setState(key: string, value: any): void {
    this.uiState.set(key, value);
    
    // Notify listeners
    const listeners = this.stateListeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        listener(value);
      }
    }
  }
  
  /**
   * Get a state value
   */
  getState(key: string): any {
    return this.uiState.get(key);
  }
  
  /**
   * Subscribe to state changes
   */
  subscribeToState(key: string, listener: (value: any) => void): () => void {
    if (!this.stateListeners.has(key)) {
      this.stateListeners.set(key, new Set());
    }
    
    this.stateListeners.get(key)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.stateListeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.stateListeners.delete(key);
        }
      }
    };
  }
  
  /**
   * Show a modal
   */
  showModal(modalId: string, modalProps?: any): void {
    this.setState(`modal:${modalId}`, {
      visible: true,
      props: modalProps
    });
    
    this.modalStack.push(modalId);
  }
  
  /**
   * Hide a modal
   */
  hideModal(modalId: string): void {
    this.setState(`modal:${modalId}`, {
      visible: false,
      props: null
    });
    
    this.modalStack = this.modalStack.filter(id => id !== modalId);
  }
  
  /**
   * Check if a modal is visible
   */
  isModalVisible(modalId: string): boolean {
    const modalState = this.getState(`modal:${modalId}`);
    return modalState ? modalState.visible : false;
  }
  
  /**
   * Get the top-most modal
   */
  getTopModal(): string | null {
    return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
  }
  
  /**
   * Get modal props
   */
  getModalProps(modalId: string): any {
    const modalState = this.getState(`modal:${modalId}`);
    return modalState ? modalState.props : null;
  }
}