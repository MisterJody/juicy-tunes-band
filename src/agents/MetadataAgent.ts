import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';
import { supabase } from '@/integrations/supabase/client';
import * as musicMetadata from 'music-metadata-browser';

/**
 * MetadataAgent handles reading and updating song metadata
 */
export class MetadataAgent extends BaseAgent {
  constructor() {
    super(
      'MetadataAgent',
      'Reads ID3 tags and allows admin edits for song metadata'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('metadata:extract', this.handleExtractMetadata.bind(this));
    this.messageHandlers.set('metadata:update', this.handleUpdateMetadata.bind(this));
    this.messageHandlers.set('metadata:batch_extract', this.handleBatchExtractMetadata.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
  }
  
  /**
   * Handle extract metadata message
   */
  private async handleExtractMetadata(message: AgentMessage): Promise<void> {
    const { songId, audioFile, audioUrl } = message.payload;
    const taskId = this.createTask(`metadata:extract:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      let metadata;
      if (audioFile) {
        // Extract metadata from file object
        metadata = await this.extractMetadataFromFile(audioFile);
      } else if (audioUrl) {
        // Extract metadata from URL
        metadata = await this.extractMetadataFromUrl(audioUrl);
      } else {
        throw new Error('No audio file or URL provided');
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Update the song record with extracted metadata
      const { data, error } = await supabase
        .from('songs')
        .update({
          title: metadata.title || 'Unknown Title',
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || 'Unknown Album',
          duration: metadata.duration || '0:00',
          year: metadata.year
        })
        .eq('id', songId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the metadata extraction is complete
      await this.sendMessage(
        message.fromAgentId,
        'metadata:extract:completed',
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
      
      // Notify the original requester that the metadata extraction failed
      await this.sendMessage(
        message.fromAgentId,
        'metadata:extract:failed',
        { songId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle update metadata message
   */
  private async handleUpdateMetadata(message: AgentMessage): Promise<void> {
    const { songId, metadata } = message.payload;
    const taskId = this.createTask(`metadata:update:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Update the song record with new metadata
      const { data, error } = await supabase
        .from('songs')
        .update({
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration,
          year: metadata.year,
          genre: metadata.genre
        })
        .eq('id', songId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the metadata update is complete
      await this.sendMessage(
        message.fromAgentId,
        'metadata:update:completed',
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
      
      // Notify the original requester that the metadata update failed
      await this.sendMessage(
        message.fromAgentId,
        'metadata:update:failed',
        { songId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle batch extract metadata message
   */
  private async handleBatchExtractMetadata(message: AgentMessage): Promise<void> {
    const { songs } = message.payload;
    const taskId = this.createTask('metadata:batch_extract').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      const results = [];
      let progress = 0;
      const progressIncrement = 100 / songs.length;
      
      for (const song of songs) {
        // Skip songs without audio files
        if (!song.audioFile && !song.audio_file) {
          console.log(`Skipping song ${song.id} as it has no audio file`);
          continue;
        }
        
        try {
          // Extract metadata
          const metadata = await this.extractMetadataFromUrl(song.audioFile || song.audio_file);
          
          // Update the song record with extracted metadata
          const { data, error } = await supabase
            .from('songs')
            .update({
              title: metadata.title || song.title || 'Unknown Title',
              artist: metadata.artist || song.artist || 'Unknown Artist',
              album: metadata.album || song.album || 'Unknown Album',
              duration: metadata.duration || song.duration || '0:00',
              year: metadata.year
            })
            .eq('id', song.id)
            .select()
            .single();
          
          if (error) {
            console.error(`Error updating song ${song.id}:`, error);
            continue;
          }
          
          results.push(data);
          
          // Notify the RealtimeAgent about the update
          await this.sendMessage(
            'realtime-agent',
            'song:updated',
            { songId: song.id, song: data }
          );
        } catch (error) {
          console.error(`Error extracting metadata for song ${song.id}:`, error);
        }
        
        progress += progressIncrement;
        this.updateTask(taskId, TaskStatus.RUNNING, Math.min(99, progress));
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, results);
      
      // Notify the original requester that the batch extraction is complete
      await this.sendMessage(
        message.fromAgentId,
        'metadata:batch_extract:completed',
        { songs: results }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the batch extraction failed
      await this.sendMessage(
        message.fromAgentId,
        'metadata:batch_extract:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Extract metadata from a file object
   */
  private async extractMetadataFromFile(file: File): Promise<any> {
    try {
      const metadata = await musicMetadata.parseBlob(file);
      
      return this.formatMetadata(metadata);
    } catch (error) {
      console.error('Error extracting metadata from file:', error);
      return this.getDefaultMetadata();
    }
  }
  
  /**
   * Extract metadata from a URL
   */
  private async extractMetadataFromUrl(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const metadata = await musicMetadata.parseBlob(blob);
      
      return this.formatMetadata(metadata);
    } catch (error) {
      console.error('Error extracting metadata from URL:', error);
      return this.getDefaultMetadata();
    }
  }
  
  /**
   * Format metadata from music-metadata-browser
   */
  private formatMetadata(metadata: musicMetadata.IAudioMetadata): any {
    const { common, format } = metadata;
    
    // Format duration as mm:ss
    let durationStr = '0:00';
    if (format.duration) {
      const minutes = Math.floor(format.duration / 60);
      const seconds = Math.floor(format.duration % 60);
      durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return {
      title: common.title || 'Unknown Title',
      artist: common.artist || 'Unknown Artist',
      album: common.album || 'Unknown Album',
      duration: durationStr,
      year: common.year,
      genre: common.genre ? common.genre[0] : undefined,
      picture: common.picture && common.picture.length > 0 ? common.picture[0] : undefined
    };
  }
  
  /**
   * Get default metadata
   */
  private getDefaultMetadata(): any {
    return {
      title: 'Unknown Title',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: '0:00'
    };
  }
  
  /**
   * Public method to extract metadata from a file
   */
  async extractMetadata(file: File): Promise<any> {
    return this.extractMetadataFromFile(file);
  }
  
  /**
   * Public method to update song metadata
   */
  async updateSongMetadata(songId: string, metadata: any): Promise<any> {
    const taskId = this.createTask(`public:metadata:update:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Update the song record with new metadata
      const { data, error } = await supabase
        .from('songs')
        .update({
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration,
          year: metadata.year,
          genre: metadata.genre
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
}