import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/pages/Index';

/**
 * Interface for a setlist
 */
export interface Setlist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for a setlist item
 */
export interface SetlistItem {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  song?: Song;
}

/**
 * SetlistAgent handles setlist creation, management, and display
 */
export class SetlistAgent extends BaseAgent {
  constructor() {
    super(
      'SetlistAgent',
      'Manages set creation, ordering, and song display'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('setlist:create', this.handleCreateSetlist.bind(this));
    this.messageHandlers.set('setlist:update', this.handleUpdateSetlist.bind(this));
    this.messageHandlers.set('setlist:delete', this.handleDeleteSetlist.bind(this));
    this.messageHandlers.set('setlist:get', this.handleGetSetlist.bind(this));
    this.messageHandlers.set('setlist:get_all', this.handleGetAllSetlists.bind(this));
    this.messageHandlers.set('setlist:add_song', this.handleAddSongToSetlist.bind(this));
    this.messageHandlers.set('setlist:remove_song', this.handleRemoveSongFromSetlist.bind(this));
    this.messageHandlers.set('setlist:reorder_songs', this.handleReorderSetlistSongs.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
  }
  
  /**
   * Handle create setlist message
   */
  private async handleCreateSetlist(message: AgentMessage): Promise<void> {
    const { name, description } = message.payload;
    const taskId = this.createTask('setlist:create').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Create the setlist
      const { data, error } = await supabase
        .from('setlists')
        .insert({
          name,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the setlist creation is complete
      await this.sendMessage(
        message.fromAgentId,
        'setlist:create:completed',
        { setlist: data }
      );
      
      // Also notify the RealtimeAgent about the new setlist
      await this.sendMessage(
        'realtime-agent',
        'setlist:created',
        { setlist: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the setlist creation failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:create:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle update setlist message
   */
  private async handleUpdateSetlist(message: AgentMessage): Promise<void> {
    const { setlistId, name, description } = message.payload;
    const taskId = this.createTask(`setlist:update:${setlistId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Update the setlist
      const { data, error } = await supabase
        .from('setlists')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', setlistId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the setlist update is complete
      await this.sendMessage(
        message.fromAgentId,
        'setlist:update:completed',
        { setlist: data }
      );
      
      // Also notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'setlist:updated',
        { setlist: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the setlist update failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:update:failed',
        { setlistId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle delete setlist message
   */
  private async handleDeleteSetlist(message: AgentMessage): Promise<void> {
    const { setlistId } = message.payload;
    const taskId = this.createTask(`setlist:delete:${setlistId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // First, delete all setlist items
      const { error: itemsError } = await supabase
        .from('setlist_items')
        .delete()
        .eq('setlist_id', setlistId);
      
      if (itemsError) {
        throw itemsError;
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Then delete the setlist
      const { error } = await supabase
        .from('setlists')
        .delete()
        .eq('id', setlistId);
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the setlist deletion is complete
      await this.sendMessage(
        message.fromAgentId,
        'setlist:delete:completed',
        { setlistId }
      );
      
      // Also notify the RealtimeAgent about the deletion
      await this.sendMessage(
        'realtime-agent',
        'setlist:deleted',
        { setlistId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the setlist deletion failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:delete:failed',
        { setlistId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle get setlist message
   */
  private async handleGetSetlist(message: AgentMessage): Promise<void> {
    const { setlistId } = message.payload;
    const taskId = this.createTask(`setlist:get:${setlistId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the setlist
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', setlistId)
        .single();
      
      if (setlistError) {
        throw setlistError;
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Get the setlist items with songs
      const { data: items, error: itemsError } = await supabase
        .from('setlist_items')
        .select(`
          *,
          song:songs(*)
        `)
        .eq('setlist_id', setlistId)
        .order('position');
      
      if (itemsError) {
        throw itemsError;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, { setlist, items });
      
      // Notify the original requester with the setlist data
      await this.sendMessage(
        message.fromAgentId,
        'setlist:get:completed',
        { setlist, items }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the setlist retrieval failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:get:failed',
        { setlistId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle get all setlists message
   */
  private async handleGetAllSetlists(message: AgentMessage): Promise<void> {
    const taskId = this.createTask('setlist:get_all').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get all setlists
      const { data, error } = await supabase
        .from('setlists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester with the setlists
      await this.sendMessage(
        message.fromAgentId,
        'setlist:get_all:completed',
        { setlists: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the setlist retrieval failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:get_all:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle add song to setlist message
   */
  private async handleAddSongToSetlist(message: AgentMessage): Promise<void> {
    const { setlistId, songId, position, notes } = message.payload;
    const taskId = this.createTask(`setlist:add_song:${setlistId}:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the current highest position
      const { data: positionData, error: positionError } = await supabase
        .from('setlist_items')
        .select('position')
        .eq('setlist_id', setlistId)
        .order('position', { ascending: false })
        .limit(1);
      
      if (positionError) {
        throw positionError;
      }
      
      // Calculate the new position
      let newPosition = 0;
      if (positionData && positionData.length > 0) {
        newPosition = positionData[0].position + 1;
      }
      
      // If position is specified, use it
      if (position !== undefined) {
        newPosition = position;
        
        // Shift existing items if needed
        const { error: shiftError } = await supabase
          .from('setlist_items')
          .update({ position: supabase.sql`position + 1` })
          .eq('setlist_id', setlistId)
          .gte('position', position);
        
        if (shiftError) {
          throw shiftError;
        }
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Add the song to the setlist
      const { data, error } = await supabase
        .from('setlist_items')
        .insert({
          setlist_id: setlistId,
          song_id: songId,
          position: newPosition,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the setlist's updated_at timestamp
      await supabase
        .from('setlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', setlistId);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the song addition is complete
      await this.sendMessage(
        message.fromAgentId,
        'setlist:add_song:completed',
        { setlistId, songId, item: data }
      );
      
      // Also notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'setlist:item:added',
        { setlistId, item: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the song addition failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:add_song:failed',
        { setlistId, songId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle remove song from setlist message
   */
  private async handleRemoveSongFromSetlist(message: AgentMessage): Promise<void> {
    const { setlistId, itemId } = message.payload;
    const taskId = this.createTask(`setlist:remove_song:${setlistId}:${itemId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the item to be removed
      const { data: item, error: itemError } = await supabase
        .from('setlist_items')
        .select('position')
        .eq('id', itemId)
        .single();
      
      if (itemError) {
        throw itemError;
      }
      
      // Remove the song from the setlist
      const { error } = await supabase
        .from('setlist_items')
        .delete()
        .eq('id', itemId);
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Shift positions of remaining items
      const { error: shiftError } = await supabase
        .from('setlist_items')
        .update({ position: supabase.sql`position - 1` })
        .eq('setlist_id', setlistId)
        .gt('position', item.position);
      
      if (shiftError) {
        throw shiftError;
      }
      
      // Update the setlist's updated_at timestamp
      await supabase
        .from('setlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', setlistId);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the song removal is complete
      await this.sendMessage(
        message.fromAgentId,
        'setlist:remove_song:completed',
        { setlistId, itemId }
      );
      
      // Also notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'setlist:item:removed',
        { setlistId, itemId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the song removal failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:remove_song:failed',
        { setlistId, itemId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle reorder setlist songs message
   */
  private async handleReorderSetlistSongs(message: AgentMessage): Promise<void> {
    const { setlistId, items } = message.payload;
    const taskId = this.createTask(`setlist:reorder_songs:${setlistId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Update each item's position
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const { error } = await supabase
          .from('setlist_items')
          .update({ position: i, updated_at: new Date().toISOString() })
          .eq('id', item.id);
        
        if (error) {
          throw error;
        }
        
        this.updateTask(taskId, TaskStatus.RUNNING, Math.floor((i + 1) / items.length * 90));
      }
      
      // Update the setlist's updated_at timestamp
      await supabase
        .from('setlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', setlistId);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100);
      
      // Notify the original requester that the reordering is complete
      await this.sendMessage(
        message.fromAgentId,
        'setlist:reorder_songs:completed',
        { setlistId }
      );
      
      // Also notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'setlist:reordered',
        { setlistId }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the reordering failed
      await this.sendMessage(
        message.fromAgentId,
        'setlist:reorder_songs:failed',
        { setlistId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Public method to create a setlist
   */
  async createSetlist(name: string, description?: string): Promise<Setlist> {
    const taskId = this.createTask('public:setlist:create').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Create the setlist
      const { data, error } = await supabase
        .from('setlists')
        .insert({
          name,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the RealtimeAgent about the new setlist
      await this.sendMessage(
        'realtime-agent',
        'setlist:created',
        { setlist: data }
      );
      
      return data;
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
  
  /**
   * Public method to get all setlists
   */
  async getAllSetlists(): Promise<Setlist[]> {
    const taskId = this.createTask('public:setlist:get_all').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get all setlists
      const { data, error } = await supabase
        .from('setlists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      return data;
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
  
  /**
   * Public method to get a setlist with its items
   */
  async getSetlist(setlistId: string): Promise<{ setlist: Setlist; items: SetlistItem[] }> {
    const taskId = this.createTask(`public:setlist:get:${setlistId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the setlist
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', setlistId)
        .single();
      
      if (setlistError) {
        throw setlistError;
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Get the setlist items with songs
      const { data: items, error: itemsError } = await supabase
        .from('setlist_items')
        .select(`
          *,
          song:songs(*)
        `)
        .eq('setlist_id', setlistId)
        .order('position');
      
      if (itemsError) {
        throw itemsError;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, { setlist, items });
      return { setlist, items };
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
  
  /**
   * Public method to add a song to a setlist
   */
  async addSongToSetlist(setlistId: string, songId: string, position?: number, notes?: string): Promise<SetlistItem> {
    const taskId = this.createTask(`public:setlist:add_song:${setlistId}:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the current highest position
      const { data: positionData, error: positionError } = await supabase
        .from('setlist_items')
        .select('position')
        .eq('setlist_id', setlistId)
        .order('position', { ascending: false })
        .limit(1);
      
      if (positionError) {
        throw positionError;
      }
      
      // Calculate the new position
      let newPosition = 0;
      if (positionData && positionData.length > 0) {
        newPosition = positionData[0].position + 1;
      }
      
      // If position is specified, use it
      if (position !== undefined) {
        newPosition = position;
        
        // Shift existing items if needed
        const { error: shiftError } = await supabase
          .from('setlist_items')
          .update({ position: supabase.sql`position + 1` })
          .eq('setlist_id', setlistId)
          .gte('position', position);
        
        if (shiftError) {
          throw shiftError;
        }
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Add the song to the setlist
      const { data, error } = await supabase
        .from('setlist_items')
        .insert({
          setlist_id: setlistId,
          song_id: songId,
          position: newPosition,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the setlist's updated_at timestamp
      await supabase
        .from('setlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', setlistId);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'setlist:item:added',
        { setlistId, item: data }
      );
      
      return data;
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
}