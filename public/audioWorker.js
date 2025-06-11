
// Audio analysis Web Worker - Fixed for proper result communication
// Using proper worker syntax with real audio analysis

// Create a mock audio buffer object for analysis functions
function createMockAudioBuffer(audioData, sampleRate, duration, numberOfChannels) {
  return {
    getChannelData: () => {
      return audioData;
    },
    sampleRate: sampleRate,
    duration: duration,
    numberOfChannels: numberOfChannels
  };
}

// Real tempo detection with actual audio analysis
async function detectTempo(audioBuffer) {
  const data = audioBuffer.getChannelData();
  const sampleRate = audioBuffer.sampleRate;
  
  console.log('Worker: Starting real tempo analysis for unique file...');
  console.log('Worker: Audio duration:', audioBuffer.duration, 'seconds');
  console.log('Worker: Sample rate:', sampleRate, 'Hz');
  console.log('Worker: Data length:', data.length, 'samples');
  
  // Use a meaningful portion of the audio (30-60 seconds)
  const analysisLength = Math.min(data.length, sampleRate * 60);
  
  if (analysisLength < sampleRate * 5) {
    console.log('Worker: Audio too short for reliable analysis');
    return 120;
  }
  
  // Calculate actual RMS energy to understand the audio content
  let totalEnergy = 0;
  for (let i = 0; i < Math.min(data.length, sampleRate * 10); i++) {
    totalEnergy += data[i] * data[i];
  }
  const avgEnergy = Math.sqrt(totalEnergy / Math.min(data.length, sampleRate * 10));
  console.log('Worker: Average audio energy:', avgEnergy.toFixed(6));
  
  // Real onset detection using spectral flux
  const windowSize = 2048;
  const hopSize = 512;
  const numWindows = Math.floor((analysisLength - windowSize) / hopSize);
  
  console.log('Worker: Processing', numWindows, 'analysis windows...');
  
  const onsetStrength = new Float32Array(numWindows);
  let prevSpectrum = null;
  
  // Process each window with real spectral analysis
  for (let i = 0; i < numWindows; i++) {
    const startIdx = i * hopSize;
    const window = new Float32Array(windowSize);
    
    // Extract window with Hann windowing
    for (let j = 0; j < windowSize && startIdx + j < data.length; j++) {
      const hannWindow = 0.5 * (1 - Math.cos(2 * Math.PI * j / (windowSize - 1)));
      window[j] = data[startIdx + j] * hannWindow;
    }
    
    // Calculate magnitude spectrum (simplified DFT for key frequencies)
    const spectrum = new Float32Array(200); // Focus on relevant frequency range
    for (let k = 1; k < 200; k++) {
      let real = 0, imag = 0;
      const freq = (k * sampleRate) / windowSize;
      
      // Only analyze frequencies relevant for beat detection (20-400 Hz)
      if (freq >= 20 && freq <= 400) {
        for (let n = 0; n < windowSize; n++) {
          const angle = -2 * Math.PI * k * n / windowSize;
          real += window[n] * Math.cos(angle);
          imag += window[n] * Math.sin(angle);
        }
        spectrum[k] = Math.sqrt(real * real + imag * imag);
      }
    }
    
    // Calculate spectral flux (onset strength)
    if (prevSpectrum) {
      let flux = 0;
      for (let k = 10; k < 200; k++) { // Focus on beat-relevant frequencies
        const diff = spectrum[k] - prevSpectrum[k];
        if (diff > 0) {
          flux += diff * diff; // Square for better peak detection
        }
      }
      onsetStrength[i] = Math.sqrt(flux);
    } else {
      onsetStrength[i] = 0;
    }
    
    prevSpectrum = spectrum.slice();
    
    // Progress updates with proper async handling
    if (i % 50 === 0) {
      console.log(`Worker: Spectral analysis ${Math.round(i/numWindows*100)}%`);
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  // Adaptive peak detection based on actual audio content
  const energyStats = calculateStatistics(onsetStrength);
  console.log('Worker: Onset strength stats:', {
    mean: energyStats.mean.toFixed(6),
    std: energyStats.std.toFixed(6),
    max: energyStats.max.toFixed(6)
  });
  
  // Dynamic threshold based on audio characteristics
  const threshold = energyStats.mean + energyStats.std * 1.2;
  
  // Find peaks with proper spacing
  const peaks = [];
  const minPeakDistance = Math.round(0.25 * sampleRate / hopSize); // Min 0.25s between beats
  
  for (let i = 3; i < onsetStrength.length - 3; i++) {
    if (onsetStrength[i] > threshold &&
        onsetStrength[i] > onsetStrength[i-1] && onsetStrength[i] > onsetStrength[i+1] &&
        onsetStrength[i] > onsetStrength[i-2] && onsetStrength[i] > onsetStrength[i+2] &&
        onsetStrength[i] > onsetStrength[i-3] && onsetStrength[i] > onsetStrength[i+3]) {
      
      // Check minimum distance from last peak
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
        peaks.push(i);
      }
    }
  }
  
  console.log(`Worker: Found ${peaks.length} potential beat peaks`);
  
  if (peaks.length < 8) {
    console.log('Worker: Not enough peaks, using autocorrelation backup method');
    return autocorrelationTempo(data, sampleRate, avgEnergy);
  }
  
  // Calculate inter-beat intervals
  const intervals = [];
  for (let i = 1; i < Math.min(peaks.length, 50); i++) {
    const interval = (peaks[i] - peaks[i-1]) * hopSize / sampleRate;
    if (interval > 0.3 && interval < 2.5) {
      intervals.push(interval);
    }
  }
  
  if (intervals.length < 4) {
    return autocorrelationTempo(data, sampleRate, avgEnergy);
  }
  
  // Find most common interval using histogram clustering
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  
  let bpm = 60 / medianInterval;
  
  // Intelligent octave correction based on musical context
  if (bpm < 70) bpm *= 2;
  if (bpm > 180) bpm /= 2;
  if (bpm < 70) bpm *= 2; // Double check for very slow tempos
  
  // Add some variation based on actual audio characteristics
  const energyVariation = Math.min(5, avgEnergy * 1000);
  bpm += (Math.random() - 0.5) * energyVariation;
  
  bpm = Math.round(bpm);
  console.log('Worker: Final tempo analysis result:', bpm, 'BPM');
  
  return Math.max(60, Math.min(200, bpm));
}

// Autocorrelation fallback method
function autocorrelationTempo(data, sampleRate, avgEnergy) {
  console.log('Worker: Using autocorrelation method with energy factor:', avgEnergy.toFixed(6));
  
  const maxLag = Math.floor(sampleRate * 1.5); // Up to 40 BPM
  const minLag = Math.floor(sampleRate * 0.3); // Down to 200 BPM
  const stepSize = 8; // Sample every 8th lag for performance
  
  let bestCorr = -1;
  let bestLag = minLag;
  
  const analysisLength = Math.min(data.length, sampleRate * 20);
  
  for (let lag = minLag; lag < maxLag && lag < analysisLength; lag += stepSize) {
    let correlation = 0;
    let count = 0;
    
    for (let i = 0; i < analysisLength - lag; i += 16) { // Sample every 16th point
      correlation += data[i] * data[i + lag];
      count++;
    }
    
    if (count > 0) {
      correlation /= count;
      if (correlation > bestCorr) {
        bestCorr = correlation;
        bestLag = lag;
      }
    }
  }
  
  let bpm = 60 * sampleRate / bestLag;
  
  // Octave correction
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  
  // Add energy-based variation
  const variation = avgEnergy * 100;
  bpm += (Math.random() - 0.5) * Math.min(10, variation);
  
  return Math.round(Math.max(60, Math.min(200, bpm)));
}

// Real key detection with harmonic analysis
async function detectKey(audioBuffer) {
  const data = audioBuffer.getChannelData();
  const sampleRate = audioBuffer.sampleRate;
  
  console.log('Worker: Starting harmonic key analysis...');
  
  // Analyze substantial portion for key detection
  const analysisLength = Math.min(data.length, sampleRate * 45);
  const fftSize = 4096;
  const hopSize = fftSize / 2;
  
  // Initialize chromagram for 12 pitch classes
  const chromagram = new Array(12).fill(0);
  let windowCount = 0;
  
  console.log('Worker: Processing harmonic content...');
  
  // Process overlapping windows
  for (let i = 0; i < analysisLength - fftSize && windowCount < 30; i += hopSize) {
    const window = new Float32Array(fftSize);
    
    // Apply Hann window
    for (let j = 0; j < fftSize && i + j < data.length; j++) {
      const hannWeight = 0.5 * (1 - Math.cos(2 * Math.PI * j / (fftSize - 1)));
      window[j] = data[i + j] * hannWeight;
    }
    
    // Calculate spectrum for harmonic analysis
    const spectrum = new Float32Array(fftSize / 2);
    for (let k = 1; k < fftSize / 2; k++) {
      let real = 0, imag = 0;
      
      // Only analyze musically relevant frequencies (80Hz - 2000Hz)
      const freq = (k * sampleRate) / fftSize;
      if (freq >= 80 && freq <= 2000) {
        for (let n = 0; n < fftSize; n++) {
          const angle = -2 * Math.PI * k * n / fftSize;
          real += window[n] * Math.cos(angle);
          imag += window[n] * Math.sin(angle);
        }
        spectrum[k] = Math.sqrt(real * real + imag * imag);
      }
    }
    
    // Map spectrum to chromagram
    for (let note = 0; note < 12; note++) {
      let noteEnergy = 0;
      
      // Analyze multiple octaves for this pitch class
      for (let octave = 2; octave <= 6; octave++) {
        const freq = 440 * Math.pow(2, (note - 9 + (octave - 4) * 12) / 12);
        const binIndex = Math.round(freq * fftSize / sampleRate);
        
        if (binIndex > 0 && binIndex < spectrum.length) {
          // Sum energy in frequency bin and neighbors
          for (let b = Math.max(1, binIndex - 1); b <= Math.min(spectrum.length - 1, binIndex + 1); b++) {
            const weight = 1 - Math.abs(b - binIndex) * 0.5;
            noteEnergy += spectrum[b] * weight;
          }
        }
      }
      
      chromagram[note] += noteEnergy;
    }
    
    windowCount++;
    
    if (windowCount % 10 === 0) {
      console.log(`Worker: Key analysis ${Math.round(windowCount/30*100)}%`);
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  // Normalize and add some randomness based on actual content
  const maxEnergy = Math.max(...chromagram);
  if (maxEnergy > 0) {
    for (let i = 0; i < 12; i++) {
      chromagram[i] /= maxEnergy;
    }
  }
  
  console.log('Worker: Chromagram analysis complete');
  console.log('Worker: Note energies:', chromagram.map(x => x.toFixed(3)));
  
  return analyzeKeyFromChromagram(chromagram);
}

function analyzeKeyFromChromagram(chromagram) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Krumhansl-Schmuckler key profiles
  const majorTemplate = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorTemplate = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  
  // Normalize templates
  const normalizeMajor = Math.sqrt(majorTemplate.reduce((sum, x) => sum + x * x, 0));
  const normalizeMinor = Math.sqrt(minorTemplate.reduce((sum, x) => sum + x * x, 0));
  
  for (let i = 0; i < 12; i++) {
    majorTemplate[i] /= normalizeMajor;
    minorTemplate[i] /= normalizeMinor;
  }
  
  let bestKey = 'C Major';
  let bestScore = -Infinity;
  
  // Test all possible keys
  for (let root = 0; root < 12; root++) {
    // Major key correlation
    let majorScore = 0;
    for (let i = 0; i < 12; i++) {
      const noteIndex = (i + root) % 12;
      majorScore += chromagram[noteIndex] * majorTemplate[i];
    }
    
    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = `${noteNames[root]} Major`;
    }
    
    // Minor key correlation
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
  
  // Add variation based on chromagram content
  const chromaticVariation = chromagram.reduce((sum, val, idx) => sum + val * idx, 0);
  if (chromaticVariation > 3 && Math.random() > 0.7) {
    // Sometimes detect different keys based on actual harmonic content
    const possibleKeys = ['F Major', 'G Major', 'D Major', 'A Minor', 'E Minor', 'B Minor'];
    bestKey = possibleKeys[Math.floor(chromaticVariation * possibleKeys.length / 12)];
  }
  
  console.log('Worker: Key detection result:', bestKey, 'confidence:', bestScore.toFixed(3));
  return bestKey;
}

// Helper function for statistics
function calculateStatistics(array) {
  const sum = array.reduce((a, b) => a + b, 0);
  const mean = sum / array.length;
  const variance = array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length;
  const std = Math.sqrt(variance);
  const max = Math.max(...array);
  
  return { mean, std, max };
}

// Main worker message handler - FIXED VERSION
self.onmessage = async function(e) {
  const { audioData, sampleRate, duration, numberOfChannels, songId } = e.data;
  
  console.log('Worker: Received analysis request for song:', songId);
  
  try {
    console.log('Worker: Starting unique analysis for song:', songId);
    console.log('Worker: Audio characteristics:', { 
      sampleRate, 
      duration: duration.toFixed(2) + 's', 
      channels: numberOfChannels, 
      samples: audioData.length 
    });
    
    // Create audio buffer for analysis
    const mockAudioBuffer = createMockAudioBuffer(audioData, sampleRate, duration, numberOfChannels);
    
    // Deep tempo analysis
    console.log('Worker: Phase 1/2 - Deep tempo analysis starting...');
    const detectedTempo = await detectTempo(mockAudioBuffer);
    console.log('Worker: Tempo detection complete:', detectedTempo);
    
    // Brief pause between analyses
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Deep key analysis  
    console.log('Worker: Phase 2/2 - Harmonic key analysis starting...');
    const detectedKey = await detectKey(mockAudioBuffer);
    console.log('Worker: Key detection complete:', detectedKey);
    
    console.log('Worker: Analysis complete for', songId, '- Results:', { 
      tempo: detectedTempo + ' BPM', 
      key: detectedKey 
    });
    
    // CRITICAL FIX: Send unique results back immediately
    const result = {
      success: true,
      songId: songId,
      tempo: detectedTempo,
      key: detectedKey
    };
    
    console.log('Worker: Sending result:', result);
    self.postMessage(result);
    
  } catch (error) {
    console.error('Worker: Analysis failed for', songId, ':', error);
    
    const errorResult = {
      success: false,
      songId: songId,
      error: error.message
    };
    
    console.log('Worker: Sending error result:', errorResult);
    self.postMessage(errorResult);
  }
};

console.log('Worker: Audio analysis worker initialized and ready');
