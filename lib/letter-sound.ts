declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!sharedContext) {
      sharedContext = new AudioContextClass();
    }

    if (sharedContext.state === "suspended") {
      void sharedContext.resume().catch((error: unknown) => {
        console.warn("[letter-sound] resume failed", error);
      });
    }

    return sharedContext;
  } catch (error) {
    console.warn("[letter-sound] audio unavailable", error);
    return null;
  }
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const bufferSize = Math.floor(context.sampleRate * 0.38);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;

  for (let index = 0; index < bufferSize; index += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    output[index] = (b0 + b1 + b2 + white * 0.1848) * 0.14;
  }

  return buffer;
}

export function playPaperAndDawnSound(unfolding: boolean): void {
  try {
    const context = getAudioContext();
    if (!context) {
      return;
    }

    const now = context.currentTime;
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(context);

    const bandpass = context.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(unfolding ? 1400 : 1050, now);
    bandpass.Q.setValueAtTime(1.1, now);

    const rustleGain = context.createGain();
    rustleGain.gain.setValueAtTime(0.001, now);
    rustleGain.gain.linearRampToValueAtTime(0.22, now + 0.06);
    rustleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    noiseSource.connect(bandpass);
    bandpass.connect(rustleGain);
    rustleGain.connect(context.destination);
    noiseSource.start(now);

    if (!unfolding) {
      return;
    }

    const dawnNotes = [349.23, 440, 523.25, 659.25, 783.99];
    dawnNotes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const startTime = now + 0.12 + index * 0.11;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.048, startTime + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.65);

      oscillator.connect(noteGain);
      noteGain.connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 1.7);
    });
  } catch (error) {
    console.warn("[letter-sound] audio unavailable", error);
  }
}
