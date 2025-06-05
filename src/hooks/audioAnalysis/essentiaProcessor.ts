import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAudioProcessor } from './simpleAudioProcessor';

// Import Essentia.js
declare global {
  interface Window {
    Essentia: unknown;
    EssentiaWASM: unknown;
  }
}

export const useEssentiaProcessor = () => {
  const { toast } = useToast();
  // Always call this hook unconditionally to maintain hook order
  const { processAudioFile: processWithSimple } = useSimpleAudioProcessor();

  const processAudioFile = useCallback(async (
    songId: string,
    audioUrl: string,
    onComplete: (songId: string) => void
  ) => {
    console.log('Starting audio analysis for song:', songId);
    
    try {
      // Try to use Essentia.js first
      if (!window.Essentia || !window.EssentiaWASM) {
        console.log('Loading Essentia.js...');
        const essentiaLoaded = await loadEssentia();
        
        if (!essentiaLoaded) {
          console.log('Essentia.js failed to load, falling back to simple processor');
          return await processWithSimple(songId, audioUrl, onComplete);
        }
      }

      // Verify Essentia is actually available
      if (!window.EssentiaWASM) {
        console.log('EssentiaWASM not available, using fallback');
        return await processWithSimple(songId, audioUrl, onComplete);
      }

      // Initialize Essentia
      const essentia = new window.EssentiaWASM();
      console.log('Essentia initialized successfully');
      
      // Fetch the audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Create audio context and decode
      const audioContext = new (window.AudioContext || ((window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext))();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('Audio loaded for Essentia analysis:', {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels
      });
      
      // Convert to mono and get audio data
      const audioData = audioBuffer.getChannelData(0);
      
      // Use a smaller sample for analysis to avoid memory issues
      const maxSamples = audioBuffer.sampleRate * 30; // 30 seconds max
      const analysisData = audioData.length > maxSamples ? 
        audioData.slice(0, maxSamples) : audioData;
      
      console.log('Converting audio data for Essentia...');
      const audioVector = essentia.arrayToVector(Array.from(analysisData));
      
      // Analyze tempo using Essentia's algorithms
      const tempo = await analyzeTempoWithEssentia(essentia, audioVector, audioBuffer.sampleRate);
      console.log('Essentia detected tempo:', tempo);
      
      // Analyze key using Essentia's key detection
      const key = await analyzeKeyWithEssentia(essentia, audioVector, audioBuffer.sampleRate);
      console.log('Essentia detected key:', key);
      
      // Update the song in the database
      const { error: dbError } = await supabase
        .from('songs')
        .update({
          tempo: tempo,
          song_key: key
        })
        .eq('id', songId);

      if (dbError) {
        console.error('Error updating song analysis:', dbError);
        toast({
          title: "Analysis update failed",
          description: "Could not save analysis results.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis complete",
          description: `Tempo: ${tempo} BPM, Key: ${key}`,
        });
      }
      
      // Clean up
      essentia.delete();
      await audioContext.close();
      
    } catch (error) {
      console.error('Essentia audio analysis failed:', error);
      console.log('Falling back to simple audio processor');
      
      // Fallback to simple processor
      return await processWithSimple(songId, audioUrl, onComplete);
    } finally {
      onComplete(songId);
    }
  }, [toast, processWithSimple]);

  return { processAudioFile };
};

// Simple loading function without complex fallback logic
async function loadEssentia(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Essentia && window.EssentiaWASM) {
      resolve(true);
      return;
    }

    // Set a timeout for loading
    const timeout = setTimeout(() => {
      console.log('Essentia loading timed out');
      resolve(false);
    }, 5000); // Reduced timeout to 5 seconds

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.web.js';
    
    script.onload = () => {
      console.log('Essentia script loaded');
      
      // Wait for the library to initialize
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkEssentia = () => {
        attempts++;
        
        if (window.EssentiaWASM && typeof window.EssentiaWASM === 'function') {
          console.log('EssentiaWASM is available');
          clearTimeout(timeout);
          resolve(true);
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(checkEssentia, 200);
        } else {
          console.log('EssentiaWASM not available after waiting');
          clearTimeout(timeout);
          resolve(false);
        }
      };
      
      checkEssentia();
    };
    
    script.onerror = () => {
      console.log('Failed to load Essentia script');
      clearTimeout(timeout);
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
}

// Simplified tempo detection using Essentia
async function analyzeTempoWithEssentia(essentia: unknown, audioVector: Float32Array, sampleRate: number): Promise<number> {
  try {
    console.log('Starting Essentia tempo analysis...');
    
    // Use RhythmExtractor2013 which is more reliable
    const rhythmExtractor = essentia.RhythmExtractor2013(sampleRate);
    const rhythm = rhythmExtractor.compute(audioVector);
    
    console.log('Rhythm analysis result:', rhythm);
    
    if (rhythm && rhythm.bpm && rhythm.bpm > 0) {
      let bpm = Math.round(rhythm.bpm);
      
      // Handle common tempo multiples
      while (bpm < 70) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      
      return Math.max(60, Math.min(200, bpm));
    }
    
    console.log('Rhythm extractor failed, trying beat tracker...');
    
    // Fallback to PercivalBpmEstimator
    try {
      const bpmEstimator = essentia.PercivalBpmEstimator(sampleRate);
      const bpm = bpmEstimator.compute(audioVector);
      
      if (bpm && bpm > 0) {
        let adjustedBpm = Math.round(bpm);
        while (adjustedBpm < 70) adjustedBpm *= 2;
        while (adjustedBpm > 180) adjustedBpm /= 2;
        return Math.max(60, Math.min(200, adjustedBpm));
      }
    } catch (bpmError) {
      console.warn('BPM estimator failed:', bpmError);
    }
    
    return 120; // Default fallback
  } catch (error) {
    console.error('Essentia tempo analysis error:', error);
    return 120;
  }
}

// Simplified key detection using Essentia
async function analyzeKeyWithEssentia(essentia: unknown, audioVector: Float32Array, sampleRate: number): Promise<string> {
  try {
    console.log('Starting Essentia key analysis...');
    
    // Use Key algorithm
    try {
      const keyExtractor = essentia.Key();
      const keyResult = keyExtractor.compute(audioVector);
      
      console.log('Key analysis result:', keyResult);
      
      if (keyResult && keyResult.key && keyResult.scale) {
        // Convert Essentia's output format to our format
        const key = keyResult.key.charAt(0).toUpperCase() + keyResult.key.slice(1);
        const scale = keyResult.scale === 'major' ? 'Major' : 'Minor';
        return `${key} ${scale}`;
      }
    } catch (keyError) {
      console.warn('Key extractor failed:', keyError);
    }
    
    // Fallback to HPCP-based analysis
    try {
      const hpcp = essentia.HPCP();
      const hpcpResult = hpcp.compute(audioVector);
      
      if (hpcpResult && hpcpResult.length >= 12) {
        return analyzeKeyFromChroma(hpcpResult);
      }
    } catch (hpcpError) {
      console.warn('HPCP analysis failed:', hpcpError);
    }
    
    return 'C Major'; // Default fallback
  } catch (error) {
    console.error('Essentia key analysis error:', error);
    return 'C Major';
  }
}

// Analyze key from chroma features
function analyzeKeyFromChroma(chroma: number[]): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Krumhansl-Schmuckler key profiles
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  
  let bestKey = 'C Major';
  let bestCorrelation = -1;
  
  // Test all possible keys
  for (let root = 0; root < 12; root++) {
    // Test major
    let majorCorr = 0;
    for (let i = 0; i < 12; i++) {
      const chromaIndex = (i + root) % 12;
      majorCorr += chroma[chromaIndex] * majorProfile[i];
    }
    
    if (majorCorr > bestCorrelation) {
      bestCorrelation = majorCorr;
      bestKey = `${noteNames[root]} Major`;
    }
    
    // Test minor
    let minorCorr = 0;
    for (let i = 0; i < 12; i++) {
      const chromaIndex = (i + root) % 12;
      minorCorr += chroma[chromaIndex] * minorProfile[i];
    }
    
    if (minorCorr > bestCorrelation) {
      bestCorrelation = minorCorr;
      bestKey = `${noteNames[root]} Minor`;
    }
  }
  
  return bestKey;
}
