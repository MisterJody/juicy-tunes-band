import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * RealtimeAgent handles real-time updates via Supabase subscriptions
 */
export class RealtimeAgent extends BaseAgent {
  private subscriptions: Map<string, { subscription: any; callback: (payload: any) => void }> = new Map();
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor() {
    super(
      'RealtimeAgent',
      'Listens to Supabase DB changes and refreshes UI in real time'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('realtime:subscribe', this.handleSubscribe.bind(this));
    this.messageHandlers.set('realtime:unsubscribe', this.handleUnsubscribe.bind(this));
    this.messageHandlers.set('song:updated', this.handleSongUpdated.bind(this));
    this.messageHandlers.set('setlist:created', this.handleSetlistCreated.bind(this));
    this.messageHandlers.set('setlist:updated', this.handleSetlistUpdated.bind(this));
    this.messageHandlers.set('setlist:deleted', this.handleSetlistDeleted.bind(this));
    this.messageHandlers.set('setlist:item:added', this.handleSetlistItemAdded.bind(this));
    this.messageHandlers.set('setlist:item:removed', this.handleSetlistItemRemoved.bind(this));
    this.messageHandlers.set('setlist:reordered', this.handleSetlistReordered.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
    
    // Remove all subscriptions
    for (const [channel, { subscription }] of this.subscriptions.entries()) {
      supabase.removeChannel(subscription);
      console.log(`Removed subscription to channel: ${channel}`);
    }
    
    this.subscriptions.clear();
  }
  
  /**
   * Handle subscribe message
   */
  private async handleSubscribe(message: AgentMessage): Promise<void> {
    const { channel, event, filter } = message.payload;
    const taskId = this.createTask(`realtime:subscribe:${channel}:${event}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Create a unique subscription ID
      const subscriptionId = `${channel}:${event}:${message.fromAgentId}`;
      
      // Check if we already have this subscription
      if (this.subscriptions.has(subscriptionId)) {
        this.updateTask(taskId, TaskStatus.COMPLETED, 100);
        
        // Notify the original requester that the subscription already exists
        await this.sendMessage(
          message.fromAgentId,
          'realtime:subscribe:completed',
          { channel, event, subscriptionId }
        );
        
        return;
      }
      
      // Create the callback function
      const callback = (payload: any) => {
        // Forward the event to the subscriber
        this.sendMessage(
          message.fromAgentId,
          'realtime:event',
          { channel, event, payload }
        ).catch(error => {
          console.error(`Error sending realtime event to ${message.fromAgentId}:`, error);
        });
      };
      
      // Create the subscription
      let subscription;
      if (filter) {
        subscription = supabase
          .channel(subscriptionId)
          .on(event, filter, callback)
          .subscribe();
      } else {
        subscription = supabase
          .channel(subscriptionId)
          .on(event, callback)
          .subscribe();
      }
      
      // Store the subscription
      this.subscriptions.set(subscriptionId, { subscription, callback });
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the subscription is created
      await this.sendMessage(
        message.fromAgentId,
        'realtime:subscribe:completed',
        { channel, event, subscriptionId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the subscription failed
      await this.sendMessage(
        message.fromAgentId,
        'realtime:subscribe:failed',
        { channel, event, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle unsubscribe message
   */
  private async handleUnsubscribe(message: AgentMessage): Promise<void> {
    const { subscriptionId } = message.payload;
    const taskId = this.createTask(`realtime:unsubscribe:${subscriptionId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Check if we have this subscription
      if (!this.subscriptions.has(subscriptionId)) {
        this.updateTask(taskId, TaskStatus.COMPLETED, 100);
        
        // Notify the original requester that the subscription doesn't exist
        await this.sendMessage(
          message.fromAgentId,
          'realtime:unsubscribe:completed',
          { subscriptionId, exists: false }
        );
        
        return;
      }
      
      // Remove the subscription
      const { subscription } = this.subscriptions.get(subscriptionId)!;
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionId);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the subscription is removed
      await this.sendMessage(
        message.fromAgentId,
        'realtime:unsubscribe:completed',
        { subscriptionId, exists: true }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the unsubscription failed
      await this.sendMessage(
        message.fromAgentId,
        'realtime:unsubscribe:failed',
        { subscriptionId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle song updated message
   */
  private async handleSongUpdated(message: AgentMessage): Promise<void> {
    const { songId, song } = message.payload;
    
    // Notify all listeners
    this.notifyListeners('song:updated', { songId, song });
  }
  
  /**
   * Handle setlist created message
   */
  private async handleSetlistCreated(message: AgentMessage): Promise<void> {
    const { setlist } = message.payload;
    
    // Notify all listeners
    this.notifyListeners('setlist:created', { setlist });
  }
  
  /**
   * Handle setlist updated message
   */
  private async handleSetlistUpdated(message: AgentMessage): Promise<void> {
    const { setlist } = message.payload;
    
    // Notify all listeners
    this.notifyListeners('setlist:updated', { setlist });
  }
  
  /**
   * Handle setlist deleted message
   */
  private async handleSetlistDeleted(message: AgentMessage): Promise<void> {
    const { setlistId } = message.payload;
    
    // Notify all listeners
    this.notifyListeners('setlist:deleted', { setlistId });
  }
  
  /**
   * Handle setlist item added message
   */
  private async handleSetlistItemAdded(message: AgentMessage): Promise<void> {
    const { setlistId, item } = message.payload;
    
    // Notify all listeners
    this.notifyListeners('setlist:item:added', { setlistId, item });
  }
  
  /**
   * Handle setlist item removed message
   */
  private async handleSetlistItemRemoved(message: AgentMessage): Promise<void> {
    const { setlistId, itemId } = message.payload;
    
    // Notify all listeners
    this.notifyListeners('setlist:item:removed', { setlistId, itemId });
  }
  
  /**
   * Handle setlist reordered message
   */
  private async handleSetlistReordered(message: AgentMessage): Promise<void> {
    const { setlistId } = message.payload;
    
    // Notify all listeners
    this.notifyListeners('setlist:reordered', { setlistId });
  }
  
  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      }
    }
  }
  
  /**
   * Subscribe to an event
   */
  addEventListener(event: string, listener: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    };
  }
  
  /**
   * Subscribe to Supabase real-time updates
   */
  subscribeToTable(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*', callback: (payload: any) => void): () => void {
    const subscriptionId = `${table}:${event}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the subscription
    const subscription = supabase
      .channel(subscriptionId)
      .on(event, { event, schema: 'public', table }, callback)
      .subscribe();
    
    // Store the subscription
    this.subscriptions.set(subscriptionId, { subscription, callback });
    
    // Return unsubscribe function
    return () => {
      if (this.subscriptions.has(subscriptionId)) {
        const { subscription } = this.subscriptions.get(subscriptionId)!;
        supabase.removeChannel(subscription);
        this.subscriptions.delete(subscriptionId);
      }
    };
  }
  
  /**
   * Subscribe to song updates
   */
  subscribeToSongUpdates(callback: (song: any) => void): () => void {
    return this.addEventListener('song:updated', callback);
  }
  
  /**
   * Subscribe to setlist updates
   */
  subscribeToSetlistUpdates(callback: (data: any) => void): () => void {
    const listeners = [
      this.addEventListener('setlist:created', callback),
      this.addEventListener('setlist:updated', callback),
      this.addEventListener('setlist:deleted', callback),
      this.addEventListener('setlist:item:added', callback),
      this.addEventListener('setlist:item:removed', callback),
      this.addEventListener('setlist:reordered', callback)
    ];
    
    // Return unsubscribe function that removes all listeners
    return () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }
}