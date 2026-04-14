// Audio context singleton to reuse the same context without re-initializing heavily
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const playOscillator = (
  type: OscillatorType,
  frequencies: number[],
  durations: number[],
  volume: number = 0.1
) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  let totalDuration = 0;
  durations.forEach((d) => (totalDuration += d));

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  
  // Schedule frequencies
  let startTime = ctx.currentTime;
  frequencies.forEach((freq, i) => {
    osc.frequency.setValueAtTime(freq, startTime);
    startTime += durations[i];
  });

  // Envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + totalDuration - 0.1);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + totalDuration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + totalDuration);
};

export const playCorrectSound = () => {
  // A pleasant high chirp: C5 -> E5 -> G5
  playOscillator('sine', [523.25, 659.25, 783.99], [0.05, 0.05, 0.1], 0.15);
};

export const playWrongSound = () => {
  // A low dull buzz or thud: Eb3 -> C3
  playOscillator('square', [155.56, 130.81], [0.1, 0.15], 0.05);
};

export const playMilestoneSound = () => {
  // A rich celebration arpeggio
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // G4, C5, E5, G5, C6
  const freqs = [392.00, 523.25, 659.25, 783.99, 1046.50];
  const durations = [0.08, 0.08, 0.08, 0.08, 0.3];
  
  playOscillator('triangle', freqs, durations, 0.15);
};
