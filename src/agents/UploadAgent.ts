import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/pages/Index';

/**
 * UploadAgent handles file uploads, triggers metadata/analysis, and stores to Supabase
 */
export class UploadAgent extends BaseAgent {
  constructor() {
    super(
      'UploadAgent',
      'Handles file uploads, triggers metadata/analysis, stores to Supabase'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('upload:song', this.handleSongUpload.bind(this));
    this.messageHandlers.set('upload:album', this.handleAlbumUpload.bind(this));
    this.messageHandlers.set('upload:lyrics', this.handleLyricsUpload.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
  }
  
  /**
   * Upload a file to Supabase storage
   */
  async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    const taskId = this.createTask('upload:file').id;
    this.updateTask(taskId, TaskStatus.RUNNING, 0);
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
  
  /**
   * Handle song upload message
   */
  private async handleSongUpload(message: AgentMessage): Promise<void> {
    const { song, audioFile, albumArtFile, lyricsFile } = message.payload;
    const taskId = this.createTask('upload:song').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 10);
      
      // Upload audio file
      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const audioUrl = await this.uploadFile(audioFile, 'audio-files', audioFileName);
      
      this.updateTask(taskId, TaskStatus.RUNNING, 40);
      
      // Upload album art if provided
      let albumArtUrl = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop';
      if (albumArtFile) {
        const artFileName = `${Date.now()}-${albumArtFile.name}`;
        const uploadedArtUrl = await this.uploadFile(albumArtFile, 'album-art', artFileName);
        if (uploadedArtUrl) {
          albumArtUrl = uploadedArtUrl;
        }
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 70);
      
      // Upload lyrics file if provided
      let lyricsFileUrl = null;
      if (lyricsFile) {
        const lyricsFileName = `${Date.now()}-${lyricsFile.name}`;
        lyricsFileUrl = await this.uploadFile(lyricsFile, 'lyrics-files', lyricsFileName);
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 90);
      
      // Create song record in database
      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          album_art_url: albumArtUrl,
          audio_file_url: audioUrl,
          lyrics_text: song.lyricsText,
          lyrics_file_url: lyricsFileUrl,
          has_lyrics: !!(song.lyricsText || lyricsFileUrl),
          upload_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Notify AudioProcessingAgent to analyze the song
      await this.sendMessage(
        'audio-processing-agent', 
        'analyze:song', 
        { songId: data.id, audioUrl }
      );
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the upload is complete
      await this.sendMessage(
        message.fromAgentId,
        'upload:song:completed',
        { songId: data.id, song: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the upload failed
      await this.sendMessage(
        message.fromAgentId,
        'upload:song:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle album upload message
   */
  private async handleAlbumUpload(message: AgentMessage): Promise<void> {
    const { albumName, songs } = message.payload;
    const taskId = this.createTask('upload:album').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      const uploadedSongs: any[] = [];
      let progress = 0;
      const progressIncrement = 100 / songs.length;
      
      for (const songData of songs) {
        // Upload each song
        const { song, audioFile, albumArtFile } = songData;
        
        // Upload audio file
        const audioFileName = `${Date.now()}-${audioFile.name}`;
        const audioUrl = await this.uploadFile(audioFile, 'audio-files', audioFileName);
        
        // Upload album art if provided (use the same art for all songs in album)
        let albumArtUrl = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop';
        if (albumArtFile) {
          const artFileName = `${Date.now()}-${albumArtFile.name}`;
          const uploadedArtUrl = await this.uploadFile(albumArtFile, 'album-art', artFileName);
          if (uploadedArtUrl) {
            albumArtUrl = uploadedArtUrl;
          }
        }
        
        // Create song record in database
        const { data, error } = await supabase
          .from('songs')
          .insert({
            title: song.title,
            artist: song.artist,
            album: albumName,
            duration: song.duration,
            album_art_url: albumArtUrl,
            audio_file_url: audioUrl,
            upload_date: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        uploadedSongs.push(data);
        
        // Notify AudioProcessingAgent to analyze the song
        await this.sendMessage(
          'audio-processing-agent', 
          'analyze:song', 
          { songId: data.id, audioUrl }
        );
        
        progress += progressIncrement;
        this.updateTask(taskId, TaskStatus.RUNNING, Math.min(99, progress));
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, uploadedSongs);
      
      // Notify the original requester that the album upload is complete
      await this.sendMessage(
        message.fromAgentId,
        'upload:album:completed',
        { albumName, songs: uploadedSongs }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the album upload failed
      await this.sendMessage(
        message.fromAgentId,
        'upload:album:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle lyrics upload message
   */
  private async handleLyricsUpload(message: AgentMessage): Promise<void> {
    const { songId, lyricsText, lyricsFile } = message.payload;
    const taskId = this.createTask('upload:lyrics').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 10);
      
      // Upload lyrics file if provided
      let lyricsFileUrl = null;
      if (lyricsFile) {
        const lyricsFileName = `${Date.now()}-${lyricsFile.name}`;
        lyricsFileUrl = await this.uploadFile(lyricsFile, 'lyrics-files', lyricsFileName);
      }
      
      this.updateTask(taskId, TaskStatus.RUNNING, 50);
      
      // Update song record with lyrics
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
      
      // Notify the original requester that the lyrics upload is complete
      await this.sendMessage(
        message.fromAgentId,
        'upload:lyrics:completed',
        { songId, song: data }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the lyrics upload failed
      await this.sendMessage(
        message.fromAgentId,
        'upload:lyrics:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Public method to upload a song
   */
  async uploadSong(song: Partial<Song>, audioFile: File, albumArtFile?: File, lyricsFile?: File): Promise<any> {
    const taskId = this.createTask('public:upload:song').id;
    
    try {
      // Upload audio file
      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const audioUrl = await this.uploadFile(audioFile, 'audio-files', audioFileName);
      
      // Upload album art if provided
      let albumArtUrl = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop';
      if (albumArtFile) {
        const artFileName = `${Date.now()}-${albumArtFile.name}`;
        const uploadedArtUrl = await this.uploadFile(albumArtFile, 'album-art', artFileName);
        if (uploadedArtUrl) {
          albumArtUrl = uploadedArtUrl;
        }
      }
      
      // Upload lyrics file if provided
      let lyricsFileUrl = null;
      if (lyricsFile) {
        const lyricsFileName = `${Date.now()}-${lyricsFile.name}`;
        lyricsFileUrl = await this.uploadFile(lyricsFile, 'lyrics-files', lyricsFileName);
      }
      
      // Create song record in database
      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration || '0:00',
          album_art_url: albumArtUrl,
          audio_file_url: audioUrl,
          lyrics_text: song.lyricsText,
          lyrics_file_url: lyricsFileUrl,
          has_lyrics: !!(song.lyricsText || lyricsFileUrl),
          upload_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify AudioProcessingAgent to analyze the song
      await this.sendMessage(
        'audio-processing-agent', 
        'analyze:song', 
        { songId: data.id, audioUrl }
      );
      
      return data;
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      throw error;
    }
  }
}