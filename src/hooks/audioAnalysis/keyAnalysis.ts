
import { applyLowPassFilter } from './audioUtils';

// Enhanced key detection using full spectrum analysis
export async function detectKeyFromBassline(audioBuffer: AudioBuffer): Promise<string> {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Use middle section for analysis (avoid intro/outro)
  const startSample = Math.floor(data.length * 0.15);
  const endSample = Math.floor(data.length * 0.85);
  const analysisData = data.slice(startSample, endSample);
  
  console.log('Key analysis on', analysisData.length, 'samples');
  
  // Enhanced chromagram using larger FFT for better frequency resolution
  const chromagram = new Array(12).fill(0);
  const fftSize = 8192; // Larger FFT for better frequency resolution
  const hopSize = fftSize / 4;
  const numWindows = Math.floor((analysisData.length - fftSize) / hopSize);
  
  for (let w = 0; w < numWindows; w++) {
    const windowStart = w * hopSize;
    const window = analysisData.slice(windowStart, windowStart + fftSize);
    
    // Apply Hann window
    for (let i = 0; i < window.length; i++) {
      window[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (window.length - 1)));
    }
    
    // Calculate magnitude spectrum using DFT
    const spectrum = new Float32Array(fftSize / 2);
    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < fftSize; n++) {
        const angle = -2 * Math.PI * k * n / fftSize;
        real += window[n] * Math.cos(angle);
        imag += window[n] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }
    
    // Map spectrum to chromagram across multiple octaves
    for (let note = 0; note < 12; note++) {
      let noteEnergy = 0;
      
      // Analyze across octaves 2-6 (covers most musical content)
      for (let octave = 2; octave <= 6; octave++) {
        const freq = 440 * Math.pow(2, (note - 9 + (octave - 4) * 12) / 12);
        const binIndex = Math.round(freq * fftSize / sampleRate);
        
        if (binIndex > 0 && binIndex < spectrum.length) {
          // Sum energy in a small window around the fundamental
          let binEnergy = 0;
          for (let b = Math.max(1, binIndex - 2); b <= Math.min(spectrum.length - 1, binIndex + 2); b++) {
            const weight = 1 - Math.abs(b - binIndex) / 3;
            binEnergy += spectrum[b] * weight;
          }
          
          // Weight lower octaves more heavily (bass emphasis)
          const octaveWeight = octave <= 3 ? 2.0 : (octave === 4 ? 1.5 : 1.0);
          noteEnergy += binEnergy * octaveWeight;
        }
      }
      
      chromagram[note] += noteEnergy;
    }
  }
  
  // Normalize chromagram
  const maxEnergy = Math.max(...chromagram);
  if (maxEnergy > 0) {
    for (let i = 0; i < 12; i++) {
      chromagram[i] /= maxEnergy;
    }
  }
  
  console.log('Enhanced chromagram:', chromagram.map(x => x.toFixed(3)));
  
  return analyzeKeyFromEnhancedChromagram(chromagram);
}

function analyzeKeyFromEnhancedChromagram(chromagram: number[]): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Enhanced key profiles (Krumhansl-Schmuckler algorithm)
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  
  // Normalize profiles
  const normalizeMajor = Math.sqrt(majorProfile.reduce((sum, x) => sum + x * x, 0));
  const normalizeMinor = Math.sqrt(minorProfile.reduce((sum, x) => sum + x * x, 0));
  majorProfile.forEach((x, i) => majorProfile[i] = x / normalizeMajor);
  minorProfile.forEach((x, i) => minorProfile[i] = x / normalizeMinor);
  
  // Normalize chromagram
  const chromaNorm = Math.sqrt(chromagram.reduce((sum, x) => sum + x * x, 0));
  if (chromaNorm > 0) {
    chromagram = chromagram.map(x => x / chromaNorm);
  }
  
  let bestKey = 'C Major';
  let bestScore = -Infinity;
  
  // Test all possible keys using correlation
  for (let root = 0; root < 12; root++) {
    // Test major key
    let majorScore = 0;
    for (let i = 0; i < 12; i++) {
      const noteIndex = (i + root) % 12;
      majorScore += chromagram[noteIndex] * majorProfile[i];
    }
    
    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = `${noteNames[root]} Major`;
    }
    
    // Test minor key
    let minorScore = 0;
    for (let i = 0; i < 12; i++) {
      const noteIndex = (i + root) % 12;
      minorScore += chromagram[noteIndex] * minorProfile[i];
    }
    
    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestKey = `${noteNames[root]} Minor`;
    }
  }
  
  console.log('Enhanced key detection:', bestKey, 'with correlation score:', bestScore.toFixed(3));
  
  // Additional validation: check if the detected key makes harmonic sense
  const rootNote = noteNames.indexOf(bestKey.split(' ')[0]);
  const isMinor = bestKey.includes('Minor');
  
  // Calculate harmonic strength
  const third = isMinor ? (rootNote + 3) % 12 : (rootNote + 4) % 12;
  const fifth = (rootNote + 7) % 12;
  
  const harmonicStrength = chromagram[rootNote] + chromagram[third] * 0.8 + chromagram[fifth] * 0.6;
  
  console.log(`Harmonic validation for ${bestKey}: root=${chromagram[rootNote].toFixed(3)}, third=${chromagram[third].toFixed(3)}, fifth=${chromagram[fifth].toFixed(3)}, strength=${harmonicStrength.toFixed(3)}`);
  
  return bestKey;
}
