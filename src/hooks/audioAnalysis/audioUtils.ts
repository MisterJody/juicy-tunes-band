
// Enhanced audio processing utilities

// Simple low-pass filter for bassline isolation
export function applyLowPassFilter(data: Float32Array, sampleRate: number, cutoffFreq: number): Float32Array {
  const filtered = new Float32Array(data.length);
  const rc = 1 / (2 * Math.PI * cutoffFreq);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  
  filtered[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    filtered[i] = alpha * data[i] + (1 - alpha) * filtered[i-1];
  }
  
  return filtered;
}

// High-pass filter for emphasizing percussive elements
export function applyHighPassFilter(data: Float32Array, sampleRate: number, cutoffFreq: number): Float32Array {
  const filtered = new Float32Array(data.length);
  const rc = 1 / (2 * Math.PI * cutoffFreq);
  const dt = 1 / sampleRate;
  const alpha = rc / (rc + dt);
  
  filtered[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    filtered[i] = alpha * (filtered[i-1] + data[i] - data[i-1]);
  }
  
  return filtered;
}

// Calculate spectral centroid for brightness analysis
export function calculateSpectralCentroid(spectrum: Float32Array, sampleRate: number): number {
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < spectrum.length; i++) {
    const freq = (i * sampleRate) / (2 * spectrum.length);
    numerator += freq * spectrum[i];
    denominator += spectrum[i];
  }
  
  return denominator > 0 ? numerator / denominator : 0;
}
