import React from 'react';
import { useAgentSongManagement } from '@/hooks/useAgentSongManagement';
import { useAgentPlayerState } from '@/hooks/useAgentPlayerState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, PauseIcon, TrashIcon, MusicIcon, RotateCwIcon } from 'lucide-react';

/**
 * Component that displays a list of songs using the agent system
 */
export const AgentSongList: React.FC = () => {
  const {
    songs,
    isLoading,
    analyzingSongs,
    handleSongDelete,
    handleReanalyzeSong,
    refreshSongs
  } = useAgentSongManagement();
  
  const {
    currentSong,
    isPlaying,
    handleSongSelect,
    togglePlayPause
  } = useAgentPlayerState(songs);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Songs</h2>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/5" />
                <Skeleton className="h-3 w-1/5" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-20 mr-2" />
              <Skeleton className="h-8 w-8" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <MusicIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium">No songs found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading your first song.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Songs ({songs.length})</h2>
        <Button variant="outline" size="sm" onClick={refreshSongs}>
          <RotateCwIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.map(song => (
          <Card key={song.id} className="w-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{song.title}</CardTitle>
                  <CardDescription>{song.artist}</CardDescription>
                </div>
                {song.albumArt && (
                  <img 
                    src={song.albumArt} 
                    alt={`${song.album} cover`} 
                    className="h-12 w-12 object-cover rounded"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{song.album}</span>
                <span>{song.duration}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {song.key && (
                  <Badge variant="outline" className="text-xs">
                    Key: {song.key}
                  </Badge>
                )}
                {song.tempo && (
                  <Badge variant="outline" className="text-xs">
                    {song.tempo} BPM
                  </Badge>
                )}
                {analyzingSongs.has(song.id) && (
                  <Badge className="text-xs bg-yellow-500">
                    Analyzing...
                  </Badge>
                )}
                {song.hasLyrics && (
                  <Badge variant="outline" className="text-xs">
                    Has Lyrics
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Button 
                variant={currentSong?.id === song.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (currentSong?.id === song.id) {
                    togglePlayPause();
                  } else {
                    handleSongSelect(song);
                  }
                }}
              >
                {currentSong?.id === song.id ? (
                  isPlaying ? <PauseIcon className="h-4 w-4 mr-2" /> : <PlayIcon className="h-4 w-4 mr-2" />
                ) : (
                  <PlayIcon className="h-4 w-4 mr-2" />
                )}
                {currentSong?.id === song.id ? (isPlaying ? 'Pause' : 'Resume') : 'Play'}
              </Button>
              
              <div className="flex gap-2">
                {(!song.key || !song.tempo) && song.audioFile && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={analyzingSongs.has(song.id)}
                    onClick={() => handleReanalyzeSong(song)}
                    title="Analyze audio"
                  >
                    <RotateCwIcon className="h-4 w-4" />
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleSongDelete(song.id, song.title)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete song"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};