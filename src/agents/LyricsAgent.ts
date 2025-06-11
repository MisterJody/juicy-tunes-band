import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * LyricsAgent handles lyrics input, storage, and display
 */
export class LyricsAgent extends BaseAgent {
  constructor() {
    super(
      'LyricsAgent',
      'Handles lyrics input (text/PDF), viewer modal, fullscreen support'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('lyrics:add', this.handleAddLyrics.bind(this));
    this.messageHandlers.set('lyrics:update', this.handleUpdateLyrics.bind(this));
    this.messageHandlers.set('lyrics:get', this.handleGetLyrics.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
  }
  
  /**
   * Handle add lyrics message
   */
  private async handleAddLyrics(message: AgentMessage): Promise<void> {
    const { songId, lyricsText, lyricsFile } = message.payload;
    const taskId = this.createTask(`lyrics:add:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Upload lyrics file if provided
      let lyricsFileUrl = null;
      if (lyricsFile) {
        // Send message to UploadAgent to handle the file upload
        const uploadMessageId = await this.sendMessage(
          'upload-agent',
          'upload:lyrics',
          { songId, lyricsText, lyricsFile }
        );
        
        // Wait for the upload to complete
        // In a real implementation, we would use a callback or event system
        // For now, we'll just update the task status
        this.updateTask(taskId, TaskStatus.RUNNING, 50);
        
        // For now, we'll handle the upload directly
        const fileName = `${Date.now()}-${lyricsFile.name}`;
        const { data, error } = await supabase.storage
          .from('lyrics-files')
          .upload(fileName, lyricsFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          throw error;
        }
        
        const { data: urlData } = supabase.storage
          .from('lyrics-files')
          .getPublicUrl(data.path);
        
        lyricsFileUrl = urlData.publicUrl;
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 75);
      
      // Update the song record with lyrics
      const { data, error } = await supabase
        .from('songs')
        .update({
          lyrics_text: lyricsText,
          lyrics_file_url: lyricsFileUrl,
          has_lyrics: !!(lyricsText || lyricsFileUrl)
        })
        .eq('id', songId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the lyrics addition is complete
      await this.sendMessage(
        message.fromAgentId,
        'lyrics:add:completed',
        { songId, song: data }
      );
      
      // Also notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'song:updated',
        { songId, song: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the lyrics addition failed
      await this.sendMessage(
        message.fromAgentId,
        'lyrics:add:failed',
        { songId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle update lyrics message
   */
  private async handleUpdateLyrics(message: AgentMessage): Promise<void> {
    const { songId, lyricsText, lyricsFile } = message.payload;
    const taskId = this.createTask(`lyrics:update:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Upload lyrics file if provided
      let lyricsFileUrl = null;
      if (lyricsFile) {
        // For now, we'll handle the upload directly
        const fileName = `${Date.now()}-${lyricsFile.name}`;
        const { data, error } = await supabase.storage
          .from('lyrics-files')
          .upload(fileName, lyricsFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          throw error;
        }
        
        const { data: urlData } = supabase.storage
          .from('lyrics-files')
          .getPublicUrl(data.path);
        
        lyricsFileUrl = urlData.publicUrl;
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Get the current song data
      const { data: currentSong, error: fetchError } = await supabase
        .from('songs')
        .select('lyrics_file_url')
        .eq('id', songId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Update the song record with lyrics
      const updateData: any = {
        has_lyrics: !!(lyricsText || lyricsFileUrl || currentSong.lyrics_file_url)
      };
      
      if (lyricsText !== undefined) {
        updateData.lyrics_text = lyricsText;
      }
      
      if (lyricsFileUrl) {
        updateData.lyrics_file_url = lyricsFileUrl;
      }
      
      const { data, error } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', songId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the lyrics update is complete
      await this.sendMessage(
        message.fromAgentId,
        'lyrics:update:completed',
        { songId, song: data }
      );
      
      // Also notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'song:updated',
        { songId, song: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the lyrics update failed
      await this.sendMessage(
        message.fromAgentId,
        'lyrics:update:failed',
        { songId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle get lyrics message
   */
  private async handleGetLyrics(message: AgentMessage): Promise<void> {
    const { songId } = message.payload;
    const taskId = this.createTask(`lyrics:get:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the song record
      const { data, error } = await supabase
        .from('songs')
        .select('lyrics_text, lyrics_file_url, has_lyrics')
        .eq('id', songId)
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester with the lyrics
      await this.sendMessage(
        message.fromAgentId,
        'lyrics:get:completed',
        { 
          songId, 
          lyricsText: data.lyrics_text,
          lyricsFileUrl: data.lyrics_file_url,
          hasLyrics: data.has_lyrics
        }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the lyrics retrieval failed
      await this.sendMessage(
        message.fromAgentId,
        'lyrics:get:failed',
        { songId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Public method to add lyrics to a song
   */
  async addLyrics(songId: string, lyricsText: string, lyricsFile?: File): Promise<any> {
    const taskId = this.createTask(`public:lyrics:add:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Upload lyrics file if provided
      let lyricsFileUrl = null;
      if (lyricsFile) {
        const fileName = `${Date.now()}-${lyricsFile.name}`;
        const { data, error } = await supabase.storage
          .from('lyrics-files')
          .upload(fileName, lyricsFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          throw error;
        }
        
        const { data: urlData } = supabase.storage
          .from('lyrics-files')
          .getPublicUrl(data.path);
        
        lyricsFileUrl = urlData.publicUrl;
      }
      
      // Update the song record with lyrics
      const { data, error } = await supabase
        .from('songs')
        .update({
          lyrics_text: lyricsText,
          lyrics_file_url: lyricsFileUrl,
          has_lyrics: !!(lyricsText || lyricsFileUrl)
        })
        .eq('id', songId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the RealtimeAgent about the update
      await this.sendMessage(
        'realtime-agent',
        'song:updated',
        { songId, song: data }
      );
      
      return data;
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
  
  /**
   * Public method to get lyrics for a song
   */
  async getLyrics(songId: string): Promise<any> {
    const taskId = this.createTask(`public:lyrics:get:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Get the song record
      const { data, error } = await supabase
        .from('songs')
        .select('lyrics_text, lyrics_file_url, has_lyrics')
        .eq('id', songId)
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      return {
        lyricsText: data.lyrics_text,
        lyricsFileUrl: data.lyrics_file_url,
        hasLyrics: data.has_lyrics
      };
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
}