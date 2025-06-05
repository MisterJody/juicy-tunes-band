
import { useState } from 'react';
import { Song } from '@/pages/Index';
import { formatDuration } from '@/utils/audioAnalysis';

export const useUploadForm = () => {
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [albumArtPreview, setAlbumArtPreview] = useState('');
  const [key, setKey] = useState('none');
  const [tempo, setTempo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setAudioFile(file);

    try {
      // Create audio element to get duration
      const audio = document.createElement('audio');
      const fileUrl = URL.createObjectURL(file);
      audio.src = fileUrl;

      audio.addEventListener('loadedmetadata', async () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(formatDuration(audio.duration));
        }
        
        if (!title) {
          const filename = file.name.replace(/\.[^/.]+$/, '');
          setTitle(filename);
        }

        URL.revokeObjectURL(fileUrl);
      });

      // Try to parse metadata if music-metadata-browser is available
      try {
        const { parseBuffer } = await import('music-metadata-browser');
        const arrayBuffer = await file.arrayBuffer();
        const metadata = await parseBuffer(new Uint8Array(arrayBuffer), file.type);

        if (metadata.common.title && !title) setTitle(metadata.common.title);
        if (metadata.common.album && !album) setAlbum(metadata.common.album);
        if (metadata.format.duration && !duration) setDuration(formatDuration(metadata.format.duration));

        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const picture = metadata.common.picture[0];
          const blob = new Blob([picture.data], { type: picture.format });
          const imageUrl = URL.createObjectURL(blob);
          setAlbumArtPreview(imageUrl);
          
          // Create a File object from the blob for upload
          const artFile = new File([blob], 'album-art.jpg', { type: picture.format });
          setAlbumArtFile(artFile);
        }

        console.log('Extracted metadata:', metadata);
      } catch (metadataError) {
        console.log('Music metadata parsing not available or failed:', metadataError);
      }

    } catch (error) {
      console.error('Error reading audio file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlbumArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAlbumArtFile(file);
    const imageUrl = URL.createObjectURL(file);
    setAlbumArtPreview(imageUrl);
  };

  const getFormData = (): Omit<Song, 'id'> => ({
    title,
    artist: 'TheBandJuicy',
    album,
    duration,
    albumArt: albumArtPreview || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop',
    audioFile: '',
    uploadDate: new Date(),
    key: key === 'none' ? undefined : key,
    tempo: tempo ? parseInt(tempo) : undefined
  });

  return {
    title,
    setTitle,
    album,
    setAlbum,
    duration,
    setDuration,
    audioFile,
    albumArtFile,
    albumArtPreview,
    key,
    setKey,
    tempo,
    setTempo,
    isLoading,
    setIsLoading,
    handleAudioFileChange,
    handleAlbumArtChange,
    getFormData
  };
};
