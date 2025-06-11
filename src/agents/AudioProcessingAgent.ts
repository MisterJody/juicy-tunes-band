import { BaseAgent } from './BaseAgent';
import { AgentMessage, TaskStatus } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * AudioProcessingAgent handles audio analysis and metadata extraction
 */
export class AudioProcessingAgent extends BaseAgent {
  private workerMap: Map<string, Worker> = new Map();
  
  constructor() {
    super(
      'AudioProcessingAgent',
      'Analyzes audio files to extract tempo, key, and other metadata'
    );
  }
  
  /**
   * Register message handlers
   */
  protected async registerMessageHandlers(): Promise<void> {
    this.messageHandlers.set('analyze:song', this.handleAnalyzeSong.bind(this));
    this.messageHandlers.set('analyze:batch', this.handleAnalyzeBatch.bind(this));
    this.messageHandlers.set('analyze:cancel', this.handleCancelAnalysis.bind(this));
  }
  
  /**
   * Unregister message handlers
   */
  protected async unregisterMessageHandlers(): Promise<void> {
    this.messageHandlers.clear();
    
    // Terminate any active workers
    for (const [songId, worker] of this.workerMap.entries()) {
      console.log(`Terminating worker for song ${songId}`);
      worker.terminate();
    }
    
    this.workerMap.clear();
  }
  
  /**
   * Handle analyze song message
   */
  private async handleAnalyzeSong(message: AgentMessage): Promise<void> {
    const { songId, audioUrl } = message.payload;
    const taskId = this.createTask(`analyze:song:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      console.log(`Starting analysis for song ${songId}`);
      
      // Check if we already have a worker for this song
      if (this.workerMap.has(songId)) {
        console.log(`Worker already exists for song ${songId}, terminating it`);
        this.workerMap.get(songId)?.terminate();
        this.workerMap.delete(songId);
      }
      
      // Analyze the audio file
      const analysisResult = await this.analyzeAudioFile(songId, audioUrl);
      
      // Update the song record with analysis results
      const { data, error } = await supabase
        .from('songs')
        .update({
          tempo: analysisResult.tempo,
          song_key: analysisResult.key
        })
        .eq('id', songId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, data);
      
      // Notify the original requester that the analysis is complete
      await this.sendMessage(
        message.fromAgentId,
        'analyze:song:completed',
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
      
      // Notify the original requester that the analysis failed
      await this.sendMessage(
        message.fromAgentId,
        'analyze:song:failed',
        { songId, error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle analyze batch message
   */
  private async handleAnalyzeBatch(message: AgentMessage): Promise<void> {
    const { songs } = message.payload;
    const taskId = this.createTask('analyze:batch').id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      const results = [];
      let progress = 0;
      const progressIncrement = 100 / songs.length;
      
      for (const song of songs) {
        // Skip songs that are already being analyzed
        if (this.workerMap.has(song.id)) {
          console.log(`Skipping song ${song.id} as it's already being analyzed`);
          continue;
        }
        
        // Skip songs without audio files
        if (!song.audioFile) {
          console.log(`Skipping song ${song.id} as it has no audio file`);
          continue;
        }
        
        // Analyze the song
        try {
          const analysisResult = await this.analyzeAudioFile(song.id, song.audioFile);
          
          // Update the song record with analysis results
          const { data, error } = await supabase
            .from('songs')
            .update({
              tempo: analysisResult.tempo,
              song_key: analysisResult.key
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
          console.error(`Error analyzing song ${song.id}:`, error);
        }
        
        progress += progressIncrement;
        this.updateTask(taskId, TaskStatus.RUNNING, Math.min(99, progress));
      }
      
      this.updateTask(taskId, TaskStatus.COMPLETED, 100, results);
      
      // Notify the original requester that the batch analysis is complete
      await this.sendMessage(
        message.fromAgentId,
        'analyze:batch:completed',
        { songs: results }
      );
    } catch (error) {
      this.updateTask(taskId, TaskStatus.FAILED, 0, undefined, error as Error);
      
      // Notify the original requester that the batch analysis failed
      await this.sendMessage(
        message.fromAgentId,
        'analyze:batch:failed',
        { error: (error as Error).message }
      );
    }
  }
  
  /**
   * Handle cancel analysis message
   */
  private async handleCancelAnalysis(message: AgentMessage): Promise<void> {
    const { songId } = message.payload;
    
    if (this.workerMap.has(songId)) {
      console.log(`Cancelling analysis for song ${songId}`);
      this.workerMap.get(songId)?.terminate();
      this.workerMap.delete(songId);
      
      // Notify the original requester that the analysis was cancelled
      await this.sendMessage(
        message.fromAgentId,
        'analyze:song:cancelled',
        { songId }
      );
    } else {
      // Notify the original requester that the song wasn't being analyzed
      await this.sendMessage(
        message.fromAgentId,
        'analyze:song:not_found',
        { songId }
      );
    }
  }
  
  /**
   * Analyze an audio file using Web Workers
   */
  private analyzeAudioFile(songId: string, audioUrl: string): Promise<{ tempo: number; key: string }> {
    return new Promise((resolve, reject) => {
      try {
        // Create the worker
        const worker = new Worker('/audioWorker.js');
        this.workerMap.set(songId, worker);
        
        // Set up worker message handler
        worker.onmessage = (event) => {
          const { success, tempo, key, error, songId: returnedSongId } = event.data;
          
          // Verify this is the result for our song
          if (returnedSongId !== songId) {
            console.warn('Received result for different song, ignoring');
            return;
          }
          
          // Clean up the worker
          worker.terminate();
          this.workerMap.delete(songId);
          
          if (success) {
            resolve({ tempo, key });
          } else {
            reject(new Error(error || 'Worker analysis failed'));
          }
        };
        
        worker.onerror = (error) => {
          console.error('Worker error:', error);
          worker.terminate();
          this.workerMap.delete(songId);
          reject(new Error('Worker error occurred'));
        };
        
        // Fetch and decode the audio file
        fetch(audioUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch audio file: ${response.statusText}`);
            }
            return response.arrayBuffer();
          })
          .then(arrayBuffer => {
            const audioContext = new (window.AudioContext || ((window as any).webkitAudioContext))();
            return audioContext.decodeAudioData(arrayBuffer);
          })
          .then(audioBuffer => {
            // Send audio data to worker
            const audioData = audioBuffer.getChannelData(0);
            
            worker.postMessage({
              audioData: audioData,
              sampleRate: audioBuffer.sampleRate,
              duration: audioBuffer.duration,
              numberOfChannels: audioBuffer.numberOfChannels,
              songId: songId
            });
            
            // Set timeout for worker
            setTimeout(() => {
              if (this.workerMap.has(songId)) {
                worker.terminate();
                this.workerMap.delete(songId);
                reject(new Error('Worker analysis timeout'));
              }
            }, 30000); // 30 second timeout
          })
          .catch(error => {
            console.error('Error processing audio:', error);
            worker.terminate();
            this.workerMap.delete(songId);
            reject(error);
          });
      } catch (error) {
        console.error('Worker setup error:', error);
        this.workerMap.delete(songId);
        reject(error);
      }
    });
  }
  
  /**
   * Public method to analyze a song
   */
  async analyzeSong(songId: string, audioUrl: string): Promise<any> {
    const taskId = this.createTask(`public:analyze:song:${songId}`).id;
    
    try {
      this.updateTask(taskId, TaskStatus.RUNNING, 0);
      
      // Analyze the audio file
      const analysisResult = await this.analyzeAudioFile(songId, audioUrl);
      
      // Update the song record with analysis results
      const { data, error } = await supabase
        .from('songs')
        .update({
          tempo: analysisResult.tempo,
          song_key: analysisResult.key
        })
        .eq('id', songId)
        .select()
        .single();
      
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
}