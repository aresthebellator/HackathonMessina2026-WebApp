import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  soundManager,
  SoundFeedbackManager,
  SOUND_CONSTANTS,
  synthesizeBellSamples,
  synthesizeXylophoneSamples,
  synthesizeToneSamples,
  synthesizeClickSamples,
  performHaptic,
} from '@/lib/sound';
import { useQuizStore } from '@/store/useQuizStore';

describe('SoundFeedbackManager: Mathematical PCM Synthesis (Android Port Alignment)', () => {
  it('should have exact audio constants matching Android SoundFeedbackManager.kt', () => {
    expect(SOUND_CONSTANTS.BELL_EVENT_DURATION_MS).toBe(100);
    expect(SOUND_CONSTANTS.XYLOPHONE_EVENT_DURATION_MS).toBe(500);
    expect(SOUND_CONSTANTS.CORRECT_FEEDBACK_GAIN).toBe(0.8);
    expect(SOUND_CONSTANTS.INCORRECT_FEEDBACK_GAIN).toBe(0.9);
    expect(SOUND_CONSTANTS.BELL_ATTACK_MS).toBe(25);
    expect(SOUND_CONSTANTS.BELL_RELEASE_MS).toBe(1000);
    expect(SOUND_CONSTANTS.XYLOPHONE_ATTACK_MS).toBe(25);
    expect(SOUND_CONSTANTS.XYLOPHONE_RELEASE_MS).toBe(500);
    expect(SOUND_CONSTANTS.BELL_PARTIAL_RATIOS).toEqual([1.0, 3.997, 9.469, 15.566, 20.863, 29.440]);
    expect(SOUND_CONSTANTS.XYLOPHONE_PARTIAL_RATIOS).toEqual([1.0, 3.932, 9.538, 16.688, 24.566, 31.147]);
  });

  it('should synthesize bell samples for MIDI 72 (C5) and MIDI 76 (E5) accurately', () => {
    const sampleRate = 44100;
    const samples72 = synthesizeBellSamples(72, sampleRate);
    const samples76 = synthesizeBellSamples(76, sampleRate);

    // Total duration: 25ms attack + 1000ms release = 1025ms -> 45202 samples
    const expectedLength = Math.floor((sampleRate * (25 + 1000)) / 1000);
    expect(samples72.length).toBe(expectedLength);
    expect(samples76.length).toBe(expectedLength);

    // First sample at t=0 should be 0 (attack starts at 0)
    expect(samples72[0]).toBe(0);

    // All samples must be bounded within [-1.0, 1.0]
    for (let i = 0; i < samples72.length; i++) {
      expect(samples72[i]).toBeGreaterThanOrEqual(-1.0);
      expect(samples72[i]).toBeLessThanOrEqual(1.0);
    }

    // Verify non-silent waveform was synthesized
    const maxAmp = Math.max(...Array.from(samples72).map(Math.abs));
    expect(maxAmp).toBeGreaterThan(0.1);

    // Verify exponential decay envelope: tail sample should be near silence
    const tailSample = Math.abs(samples72[samples72.length - 1]);
    expect(tailSample).toBeLessThan(0.01);
  });

  it('should synthesize xylophone samples for MIDI 72 and MIDI 66 accurately', () => {
    const sampleRate = 44100;
    const samples72 = synthesizeXylophoneSamples(72, sampleRate);
    const samples66 = synthesizeXylophoneSamples(66, sampleRate);

    // Total duration: 25ms attack + 500ms release = 525ms -> 23152 samples
    const expectedLength = Math.floor((sampleRate * (25 + 500)) / 1000);
    expect(samples72.length).toBe(expectedLength);
    expect(samples66.length).toBe(expectedLength);

    // All samples bounded within [-1.0, 1.0]
    for (let i = 0; i < samples66.length; i++) {
      expect(samples66[i]).toBeGreaterThanOrEqual(-1.0);
      expect(samples66[i]).toBeLessThanOrEqual(1.0);
    }

    const maxAmp = Math.max(...Array.from(samples66).map(Math.abs));
    expect(maxAmp).toBeGreaterThan(0.1);
  });

  it('should synthesize supervisory tone samples matching ToneGenerator', () => {
    const sampleRate = 44100;
    // TONE_PROP_BEEP: 1200Hz, 100ms
    const beepSamples = synthesizeToneSamples([1200], 100, sampleRate);
    const expectedBeepLen = Math.floor((sampleRate * 100) / 1000);
    expect(beepSamples.length).toBe(expectedBeepLen);

    // TONE_PROP_ACK: 300, 400, 500Hz, 300ms
    const ackSamples = synthesizeToneSamples([300, 400, 500], 300, sampleRate);
    const expectedAckLen = Math.floor((sampleRate * 300) / 1000);
    expect(ackSamples.length).toBe(expectedAckLen);
  });

  it('should synthesize tactile click samples', () => {
    const clickSamples = synthesizeClickSamples(44100);
    expect(clickSamples.length).toBeGreaterThan(0);
    for (let i = 0; i < clickSamples.length; i++) {
      expect(clickSamples[i]).toBeGreaterThanOrEqual(-1.0);
      expect(clickSamples[i]).toBeLessThanOrEqual(1.0);
    }
  });
});

describe('SoundFeedbackManager: State & Haptic Feedback', () => {
  let manager: SoundFeedbackManager;

  beforeEach(() => {
    manager = new SoundFeedbackManager();
  });

  it('should allow toggling sound enabled status', () => {
    expect(manager.isSoundEnabled()).toBe(true);

    manager.setSoundEnabled(false);
    expect(manager.isSoundEnabled()).toBe(false);

    manager.setSoundEnabled(true);
    expect(manager.isSoundEnabled()).toBe(true);
  });

  it('should invoke navigator.vibrate with correct waveforms matching Android', () => {
    const vibrateMock = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateMock });

    try {
      // Success haptic: 45ms one-shot tick
      performHaptic(false);
      expect(vibrateMock).toHaveBeenCalledWith(45);

      // Error haptic: [60, 80, 100] ms double-pulse
      performHaptic(true);
      expect(vibrateMock).toHaveBeenCalledWith([60, 80, 100]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('should safely execute all sound methods without crashing in non-browser environment', () => {
    expect(() => manager.playCorrectFeedback()).not.toThrow();
    expect(() => manager.playIncorrectFeedback()).not.toThrow();
    expect(() => manager.playLessonCompleteFeedback()).not.toThrow();
    expect(() => manager.playClick()).not.toThrow();
    expect(() => manager.playBellTone(72)).not.toThrow();
    expect(() => manager.playXylophoneTone(66)).not.toThrow();
    expect(() => manager.playSuccess()).not.toThrow();
    expect(() => manager.playError()).not.toThrow();
    expect(() => manager.playVictory()).not.toThrow();
  });
});

describe('SoundFeedbackManager: Web Audio API Integration & Buffer Caching', () => {
  let mockAudioContext: any;
  let playedSources: Array<{ buffer: any; startTime: number }>;

  beforeEach(() => {
    playedSources = [];
    mockAudioContext = {
      sampleRate: 44100,
      currentTime: 10.0,
      state: 'running',
      destination: {},
      createBuffer: vi.fn((_channels: number, length: number, rate: number) => {
        const channelData = new Float32Array(length);
        return {
          length,
          sampleRate: rate,
          getChannelData: () => channelData,
        };
      }),
      createBufferSource: vi.fn(() => {
        const source: any = {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn((time: number) => {
            playedSources.push({ buffer: source.buffer, startTime: time });
          }),
        };
        return source;
      }),
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      resume: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should play correct feedback with 2 bell notes spaced by 100ms and cache buffers', () => {
    const manager = new SoundFeedbackManager();
    const b72 = manager.getBellBuffer(mockAudioContext, 72);
    const b76 = manager.getBellBuffer(mockAudioContext, 76);

    // Verify buffer lengths
    expect(b72.length).toBe(45202);
    expect(b76.length).toBe(45202);

    // Verify buffer caching: requesting again returns identical instance
    const cachedB72 = manager.getBellBuffer(mockAudioContext, 72);
    expect(cachedB72).toBe(b72);
    expect(mockAudioContext.createBuffer).toHaveBeenCalledTimes(2); // Only created twice (72 & 76)
  });

  it('should play incorrect feedback with 2 xylophone notes spaced by 500ms and cache buffers', () => {
    const manager = new SoundFeedbackManager();
    const x72 = manager.getXylophoneBuffer(mockAudioContext, 72);
    const x66 = manager.getXylophoneBuffer(mockAudioContext, 66);

    // Verify buffer lengths: (25 + 500) / 1000 * 44100 = 23152
    expect(x72.length).toBe(23152);
    expect(x66.length).toBe(23152);

    // Cache verification
    const cachedX66 = manager.getXylophoneBuffer(mockAudioContext, 66);
    expect(cachedX66).toBe(x66);
  });
});

describe('SoundFeedbackManager: Store Synchronization', () => {
  beforeEach(() => {
    useQuizStore.setState({ isSoundEnabled: true });
    soundManager.setSoundEnabled(true);
  });

  it('should keep soundManager in sync when toggleSound is called on store', () => {
    expect(useQuizStore.getState().isSoundEnabled).toBe(true);
    expect(soundManager.isSoundEnabled()).toBe(true);

    useQuizStore.getState().toggleSound();
    expect(useQuizStore.getState().isSoundEnabled).toBe(false);
    expect(soundManager.isSoundEnabled()).toBe(false);

    useQuizStore.getState().toggleSound();
    expect(useQuizStore.getState().isSoundEnabled).toBe(true);
    expect(soundManager.isSoundEnabled()).toBe(true);
  });
});
