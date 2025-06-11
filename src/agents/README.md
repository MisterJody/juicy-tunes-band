# Agent System for TheBandJuicy App

This directory contains the autonomous agent system that powers the TheBandJuicy App. Each agent is responsible for a specific domain of functionality, allowing for modular and maintainable code.

## Architecture

The agent system is built around the following components:

- **BaseAgent**: Abstract base class that all agents extend
- **AgentRegistry**: Central registry for all agents
- **AgentManager**: Singleton that initializes and manages all agents
- **AgentProvider**: React context provider for accessing agents in components

## Agents

### UploadAgent
Handles file uploads, triggers metadata/analysis, and stores files to Supabase.

### AudioProcessingAgent
Analyzes audio files to extract tempo, key, and other metadata using Web Workers.

### MetadataAgent
Reads ID3 tags from audio files and allows admin edits for song metadata.

### LyricsAgent
Handles lyrics input (text/PDF), storage, and retrieval.

### SetlistAgent
Manages setlist creation, ordering, and song management.

### UIAgent
Handles UI state, transitions, and modals.

### RealtimeAgent
Listens to Supabase DB changes and refreshes UI in real time.

### ErrorWatcherAgent
Detects and logs errors, retries actions, and provides user feedback.

## Usage

### In React Components

```tsx
import { useAgentContext } from '@/components/AgentProvider';

const MyComponent = () => {
  const { 
    uploadAgent, 
    audioProcessingAgent,
    // ... other agents
    isInitialized 
  } = useAgentContext();
  
  // Use the agents
  const handleUpload = async (file) => {
    if (!isInitialized) return;
    
    try {
      const result = await uploadAgent.uploadFile(file, 'audio-files', file.name);
      // Do something with the result
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    // ...
  );
};
```

### Using Hooks

The agent system provides several hooks for common operations:

- `useAgentSongManagement`: For managing songs
- `useAgentSetlistManagement`: For managing setlists
- `useAgentPlayerState`: For managing the player state
- `useAgentUploadForm`: For handling uploads

Example:

```tsx
import { useAgentSongManagement } from '@/hooks/useAgentSongManagement';

const MySongList = () => {
  const {
    songs,
    isLoading,
    handleSongDelete,
    handleSongUpdate
  } = useAgentSongManagement();
  
  // Use the functions
  
  return (
    // ...
  );
};
```

## Communication

Agents communicate with each other using a message-passing system. Each agent can send messages to other agents and register handlers for specific message types.

Example:

```typescript
// Send a message from one agent to another
await this.sendMessage(
  'audio-processing-agent',
  'analyze:song',
  { songId: data.id, audioUrl }
);

// Handle a message in an agent
this.messageHandlers.set('analyze:song', this.handleAnalyzeSong.bind(this));
```

## Error Handling

The ErrorWatcherAgent provides centralized error handling for the entire system. Agents can report errors to the ErrorWatcherAgent, which will log them and provide feedback to the user.

Example:

```typescript
try {
  // Do something
} catch (error) {
  errorWatcherAgent.reportError(error as Error, { action: 'upload_song', song: newSong });
}
```