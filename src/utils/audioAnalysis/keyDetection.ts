
// Improved key detection using harmonic analysis
export async function detectKey(audioBuffer: AudioBuffer): Promise<string> {
  const data = audioBuffer.getChannelData();
  const sampleRate = audioBuffer.sampleRate;
  
  console.log('Starting improved key analysis...');
  
  // Use longer analysis for better frequency resolution
  const analysisLength = Math.min(data.length, sampleRate * 60); // Up to 60 seconds
  const fftSize = 16384; // Larger FFT for better frequency resolution
  const hopSize = fftSize / 4;
  
  // Initialize chromagram (12-note pitch class profile)
  const chromagram = new Array(12).fill(0);
  let windowCount = 0;
  
  // Process audio in overlapping windows
  for (let i = 0; i < analysisLength - fftSize; i += hopSize) {
    const window = data.slice(i, i + fftSize);
    
    // Apply Hann window
    for (let j = 0; j < window.length; j++) {
      window[j] *= 0.5 * (1 - Math.cos(2 * Math.PI * j / (window.length - 1)));
    }
    
    // Calculate magnitude spectrum
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
    
    // Map spectrum bins to chromagram
    for (let note = 0; note < 12; note++) {
      let noteEnergy = 0;
      
      // Sum energy across multiple octaves for this pitch class
      for (let octave = 1; octave <= 7; octave++) {
        // Calculate frequency for this note and octave
        const freq = 440 * Math.pow(2, (note - 9 + (octave - 4) * 12) / 12);
        const binIndex = Math.round(freq * fftSize / sampleRate);
        
        if (binIndex > 0 && binIndex < spectrum.length) {
          // Sum energy in a small window around the bin
          for (let b = Math.max(1, binIndex - 2); b <= Math.min(spectrum.length - 1, binIndex + 2); b++) {
            // Weight by distance from center frequency
            const weight = 1 - Math.abs(b - binIndex) / 3;
            noteEnergy += spectrum[b] * weight;
          }
        }
      }
      
      chromagram[note] += noteEnergy;
    }
    windowCount++;
  }
  
  // Normalize chromagram
  if (windowCount > 0) {
    const maxEnergy = Math.max(...chromagram);
    if (maxEnergy > 0) {
      for (let i = 0; i < 12; i++) {
        chromagram[i] /= maxEnergy;
      }
    }
  }
  
  console.log('Normalized chromagram:', chromagram.map(x => x.toFixed(3)));
  
  return analyzeKeyFromChromagram(chromagram);
}

function analyzeKeyFromChromagram(chromagram: number[]): string {
  // Improved key templates based on music theory
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Major scale template (Krumhansl-Schmuckler key-finding algorithm weights)
  const majorTemplate = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  // Minor scale template
  const minorTemplate = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  
  // Normalize templates
  const normalizeMajor = Math.sqrt(majorTemplate.reduce((sum, x) => sum + x * x, 0));
  const normalizeMinor = Math.sqrt(minorTemplate.reduce((sum, x) => sum + x * x, 0));
  majorTemplate.forEach((x, i) => majorTemplate[i] = x / normalizeMajor);
  minorTemplate.forEach((x, i) => minorTemplate[i] = x / normalizeMinor);
  
  let bestKey = 'C Major';
  let bestScore = -Infinity;
  
  // Test all possible keys using correlation
  for (let root = 0; root < 12; root++) {
    // Test major key
    let majorScore = 0;
    for (let i = 0; i < 12; i++) {
      const noteIndex = (i + root) % 12;
      majorScore += chromagram[noteIndex] * majorTemplate[i];
    }
    
    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = `${noteNames[root]} Major`;
    }
    
    // Test minor key
    let minorScore = 0;
    for (let i = 0; i < 12; i++) {
      const noteIndex = (i + root) % 12;
      minorScore += chromagram[noteIndex] * minorTemplate[i];
    }
    
    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestKey = `${noteNames[root]} Minor`;
    }
  }
  
  console.log('Detected key:', bestKey, 'with correlation score:', bestScore.toFixed(3));
  return bestKey;
}
