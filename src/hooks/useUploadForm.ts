import { useState } from 'react';
import { Song } from '@/pages/Index';
import { formatDuration } from '@/utils/audioAnalysis';

export const useUploadForm = () => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('TheBandJuicy'); // Set default artist
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [albumArtPreview, setAlbumArtPreview] = useState('');
  const [key, setKey] = useState('none');
  const [tempo, setTempo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError(null);
    setIsLoading(true);
    setAudioFile(file);

    // Immediately set the title from filename if empty
    if (!title) {
      const filename = file.name.replace(/\.[^/.]+$/, '');
      const cleanTitle = filename
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setTitle(cleanTitle);
      console.log('Set title from filename:', cleanTitle);
    }

    try {
      // Create audio element to get duration
      const audio = document.createElement('audio');
      const fileUrl = URL.createObjectURL(file);
      audio.src = fileUrl;
      audio.preload = 'metadata';

      const loadMetadata = new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          console.log('Audio metadata loaded, duration:', audio.duration);
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            const formattedDuration = formatDuration(audio.duration);
            setDuration(formattedDuration);
            console.log('Set duration:', formattedDuration);
          } else {
            console.log('Could not determine duration, setting default');
            setDuration('0:00');
          }
          URL.revokeObjectURL(fileUrl);
          resolve(true);
        });

        audio.addEventListener('error', (e) => {
          console.error('Error loading audio metadata:', e);
          URL.revokeObjectURL(fileUrl);
          reject(e);
        });

        // Fallback timeout
        setTimeout(() => {
          console.log('Metadata loading timeout, using defaults');
          if (!duration) setDuration('0:00');
          URL.revokeObjectURL(fileUrl);
          resolve(true);
        }, 5000);
      });

      // Load the audio metadata
      audio.load();
      await loadMetadata;

    } catch (error) {
      console.error('Error reading audio file:', error);
      // Set defaults on error
      if (!duration) setDuration('0:00');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlbumArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setAlbumArtFile(file);
    const imageUrl = URL.createObjectURL(file);
    setAlbumArtPreview(imageUrl);
  };

  const getFormData = (): Omit<Song, 'id'> => ({
    title,
    artist,
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
    artist,
    setArtist,
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
    error,
    setError,
    handleAudioFileChange,
    handleAlbumArtChange,
    getFormData
  };
};
