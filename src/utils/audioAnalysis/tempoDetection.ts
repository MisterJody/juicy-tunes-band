
// Improved tempo detection using spectral flux and autocorrelation
export async function detectTempo(audioBuffer: AudioBuffer): Promise<number> {
  const data = audioBuffer.getChannelData();
  const sampleRate = audioBuffer.sampleRate;
  
  console.log('Starting improved tempo analysis...');
  
  // Use first 45 seconds for better analysis
  const analysisLength = Math.min(data.length, sampleRate * 45);
  
  // Apply high-pass filter to emphasize percussive elements
  const filteredData = new Float32Array(analysisLength);
  const alpha = 0.97; // High-pass filter coefficient
  filteredData[0] = data[0];
  for (let i = 1; i < analysisLength; i++) {
    filteredData[i] = alpha * (filteredData[i-1] + data[i] - data[i-1]);
  }
  
  // Calculate spectral flux (onset detection)
  const windowSize = 2048;
  const hopSize = 512;
  const numWindows = Math.floor((analysisLength - windowSize) / hopSize);
  const onsetStrength = new Float32Array(numWindows);
  
  let prevSpectrum = new Float32Array(windowSize / 2);
  
  for (let i = 0; i < numWindows; i++) {
    const startIdx = i * hopSize;
    const window = filteredData.slice(startIdx, startIdx + windowSize);
    
    // Apply Hann window
    for (let j = 0; j < window.length; j++) {
      window[j] *= 0.5 * (1 - Math.cos(2 * Math.PI * j / (window.length - 1)));
    }
    
    // Calculate magnitude spectrum using simple DFT
    const spectrum = new Float32Array(windowSize / 2);
    for (let k = 0; k < windowSize / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < windowSize; n++) {
        const angle = -2 * Math.PI * k * n / windowSize;
        real += window[n] * Math.cos(angle);
        imag += window[n] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }
    
    // Calculate spectral flux (positive changes in spectrum)
    let flux = 0;
    for (let k = 0; k < spectrum.length; k++) {
      const diff = spectrum[k] - prevSpectrum[k];
      if (diff > 0) flux += diff;
    }
    onsetStrength[i] = flux;
    prevSpectrum = spectrum.slice();
  }
  
  console.log('Onset strength calculated, peak picking...');
  
  // Peak picking on onset strength
  const peaks = [];
  const meanOnset = onsetStrength.reduce((a, b) => a + b) / onsetStrength.length;
  const threshold = meanOnset * 1.5;
  
  for (let i = 3; i < onsetStrength.length - 3; i++) {
    if (onsetStrength[i] > threshold &&
        onsetStrength[i] > onsetStrength[i-1] &&
        onsetStrength[i] > onsetStrength[i+1] &&
        onsetStrength[i] > onsetStrength[i-2] &&
        onsetStrength[i] > onsetStrength[i+2]) {
      peaks.push(i);
    }
  }
  
  console.log('Peaks found:', peaks.length);
  
  if (peaks.length < 8) {
    console.log('Not enough peaks, using autocorrelation fallback');
    return autocorrelationTempo(filteredData, sampleRate);
  }
  
  // Calculate inter-onset intervals
  const intervals = [];
  for (let i = 1; i < Math.min(peaks.length, 100); i++) {
    const interval = (peaks[i] - peaks[i-1]) * hopSize / sampleRate;
    if (interval > 0.3 && interval < 2.0) { // Filter reasonable intervals
      intervals.push(interval);
    }
  }
  
  if (intervals.length < 4) {
    return autocorrelationTempo(filteredData, sampleRate);
  }
  
  // Find most common interval using histogram
  intervals.sort((a, b) => a - b);
  const bins = 100;
  const minInterval = intervals[0];
  const maxInterval = intervals[intervals.length - 1];
  const binSize = (maxInterval - minInterval) / bins;
  const histogram = new Array(bins).fill(0);
  
  intervals.forEach(interval => {
    const binIdx = Math.floor((interval - minInterval) / binSize);
    if (binIdx >= 0 && binIdx < bins) {
      histogram[binIdx]++;
    }
  });
  
  const maxBinIdx = histogram.indexOf(Math.max(...histogram));
  const dominantInterval = minInterval + (maxBinIdx + 0.5) * binSize;
  
  let bpm = 60 / dominantInterval;
  
  // Handle tempo multiples/subdivisions
  while (bpm < 80) bpm *= 2;
  while (bpm > 160) bpm /= 2;
  
  bpm = Math.round(bpm);
  console.log('Detected tempo (spectral flux):', bpm, 'BPM');
  return Math.max(60, Math.min(200, bpm));
}

// Fallback autocorrelation-based tempo detection
export function autocorrelationTempo(data: Float32Array, sampleRate: number): number {
  console.log('Using autocorrelation tempo detection...');
  
  const maxLag = Math.floor(sampleRate * 1.5); // Up to 1.5 seconds (40 BPM)
  const minLag = Math.floor(sampleRate * 0.3); // Down to 0.3 seconds (200 BPM)
  
  const autocorr = new Float32Array(maxLag - minLag);
  const dataLength = Math.min(data.length, sampleRate * 30); // Use 30 seconds
  
  for (let lag = minLag; lag < maxLag && lag < dataLength; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < dataLength - lag; i++) {
      sum += data[i] * data[i + lag];
      count++;
    }
    autocorr[lag - minLag] = count > 0 ? sum / count : 0;
  }
  
  // Find the lag with maximum autocorrelation
  let maxCorr = -Infinity;
  let bestLag = minLag;
  for (let i = 0; i < autocorr.length; i++) {
    if (autocorr[i] > maxCorr) {
      maxCorr = autocorr[i];
      bestLag = minLag + i;
    }
  }
  
  const bpm = Math.round(60 * sampleRate / bestLag);
  console.log('Autocorrelation tempo:', bpm, 'BPM');
  return Math.max(60, Math.min(200, bpm));
}
