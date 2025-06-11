import React, { useState } from 'react';
import { AgentSongList } from '@/components/AgentSongList';
import { AgentStatusIndicator } from '@/components/AgentStatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgentUploadForm } from '@/hooks/useAgentUploadForm';
import { useAgentContext } from '@/components/AgentProvider';
import { UploadIcon, MusicIcon, ListMusicIcon, SettingsIcon } from 'lucide-react';

/**
 * Demo page for the agent system
 */
const AgentDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('songs');
  const { isInitialized } = useAgentContext();
  
  const {
    title,
    setTitle,
    artist,
    setArtist,
    album,
    setAlbum,
    audioFile,
    albumArtFile,
    isLoading,
    handleAudioFileChange,
    handleAlbumArtFileChange,
    resetForm,
    uploadSong
  } = useAgentUploadForm();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return;
    
    await uploadSong();
    setActiveTab('songs');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Agent System Demo</h1>
        <p className="text-gray-500">
          This demo showcases the agent-based architecture for managing music files
        </p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="songs" className="flex items-center">
            <MusicIcon className="h-4 w-4 mr-2" />
            Songs
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center">
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="setlists" className="flex items-center">
            <ListMusicIcon className="h-4 w-4 mr-2" />
            Setlists
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="songs" className="mt-0">
          <AgentSongList />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Upload a Song</CardTitle>
              <CardDescription>
                Add a new song to your library. MP3, WAV, and FLAC files are supported.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Song title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Artist name"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="album">Album</Label>
                  <Input
                    id="album"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="Album name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audioFile">Audio File</Label>
                  <Input
                    id="audioFile"
                    type="file"
                    accept=".mp3,.wav,.flac"
                    onChange={(e) => handleAudioFileChange(e.target.files?.[0] || null)}
                    required
                  />
                  {audioFile && (
                    <p className="text-sm text-gray-500">Selected: {audioFile.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="albumArt">Album Art (optional)</Label>
                  <Input
                    id="albumArt"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAlbumArtFileChange(e.target.files?.[0] || null)}
                  />
                  {albumArtFile && (
                    <p className="text-sm text-gray-500">Selected: {albumArtFile.name}</p>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit} 
                disabled={!isInitialized || isLoading || !audioFile}
              >
                {isLoading ? 'Uploading...' : 'Upload Song'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="setlists" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Setlists</CardTitle>
              <CardDescription>
                Create and manage your setlists for gigs and practice sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-12 text-gray-500">
                Setlist management coming soon!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AgentStatusIndicator />
    </div>
  );
};

export default AgentDemo;