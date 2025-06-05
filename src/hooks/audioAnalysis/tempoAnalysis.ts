
// Improved tempo detection focusing on beat patterns and onset detection
export async function detectTempoFromBeats(audioBuffer: AudioBuffer): Promise<number> {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  console.log('Tempo analysis: Processing', data.length, 'samples at', sampleRate, 'Hz');
  
  // Use first 30 seconds for analysis to speed up processing
  const analysisLength = Math.min(data.length, sampleRate * 30);
  console.log('Using', analysisLength, 'samples for tempo analysis');
  
  // Apply high-pass filter to emphasize percussive elements
  const filteredData = new Float32Array(analysisLength);
  const alpha = 0.97;
  filteredData[0] = data[0];
  for (let i = 1; i < analysisLength; i++) {
    filteredData[i] = alpha * (filteredData[i-1] + data[i] - data[i-1]);
  }
  
  // Calculate energy using smaller windows for better time resolution
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const hopSize = Math.floor(windowSize / 2); // 50% overlap
  const energyPeaks = [];
  
  console.log('Calculating energy with window size:', windowSize, 'hop size:', hopSize);
  
  // Calculate RMS energy for each window
  for (let i = 0; i < analysisLength - windowSize; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += filteredData[i + j] * filteredData[i + j];
    }
    energy = Math.sqrt(energy / windowSize);
    
    const timeStamp = i / sampleRate;
    energyPeaks.push({ time: timeStamp, energy });
  }
  
  // Find peaks using adaptive threshold
  const energyValues = energyPeaks.map(p => p.energy);
  const meanEnergy = energyValues.reduce((a, b) => a + b) / energyValues.length;
  const energyStd = Math.sqrt(energyValues.reduce((sum, e) => sum + Math.pow(e - meanEnergy, 2), 0) / energyValues.length);
  const threshold = meanEnergy + energyStd * 0.3; // Lower threshold for more sensitivity
  
  const beats = [];
  for (let i = 1; i < energyPeaks.length - 1; i++) {
    const current = energyPeaks[i];
    const prev = energyPeaks[i - 1];
    const next = energyPeaks[i + 1];
    
    if (current.energy > threshold && 
        current.energy > prev.energy && 
        current.energy > next.energy) {
      beats.push(current.time);
    }
  }
  
  console.log('Found', beats.length, 'potential beats');
  
  if (beats.length < 8) {
    console.log('Not enough beats found, using fallback method');
    return fallbackTempoDetection(data, sampleRate);
  }
  
  // Calculate inter-beat intervals
  const intervals = [];
  for (let i = 1; i < Math.min(beats.length, 50); i++) {
    const interval = beats[i] - beats[i-1];
    if (interval > 0.25 && interval < 2.0) { // Reasonable beat interval range
      intervals.push(interval);
    }
  }
  
  if (intervals.length < 4) {
    console.log('Not enough valid intervals, using fallback');
    return fallbackTempoDetection(data, sampleRate);
  }
  
  // Use median instead of histogram for more robust estimation
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  
  let bpm = Math.round(60 / medianInterval);
  
  console.log('Initial BPM from median interval:', bpm);
  
  // Handle common tempo multiples more aggressively
  if (bpm < 80) {
    bpm *= 2;
    console.log('Doubled tempo to:', bpm);
  }
  if (bpm < 80) {
    bpm *= 2;
    console.log('Doubled again to:', bpm);
  }
  if (bpm > 180) {
    bpm /= 2;
    console.log('Halved tempo to:', bpm);
  }
  if (bpm > 180) {
    bpm /= 2;
    console.log('Halved again to:', bpm);
  }
  
  const finalBpm = Math.max(70, Math.min(180, bpm));
  console.log('Final tempo:', finalBpm, 'BPM');
  return finalBpm;
}

// Enhanced fallback tempo detection
function fallbackTempoDetection(data: Float32Array, sampleRate: number): number {
  console.log('Using autocorrelation fallback tempo detection...');
  
  const maxLag = Math.floor(sampleRate * 1.5); // Up to 1.5 seconds
  const minLag = Math.floor(sampleRate * 0.3); // Down to 0.3 seconds
  const analysisLength = Math.min(data.length, sampleRate * 20);
  
  let bestCorrelation = -1;
  let bestLag = minLag;
  
  for (let lag = minLag; lag < maxLag && lag < analysisLength; lag += 8) {
    let correlation = 0;
    let count = 0;
    
    for (let i = 0; i < analysisLength - lag; i += 32) {
      correlation += data[i] * data[i + lag];
      count++;
    }
    
    if (count > 0) {
      correlation /= count;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }
  }
  
  let bpm = Math.round(60 * sampleRate / bestLag);
  
  // Apply tempo doubling/halving
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  
  console.log('Fallback autocorrelation tempo:', bpm, 'BPM');
  return Math.max(70, Math.min(180, bpm));
}
