/**
 * SoundFeedbackManager for Web App (Ported directly from Android Wikingo SoundFeedbackManager.kt)
 *
 * Provides instant audio-tactile feedback for gamified Duolingo interactions.
 * Uses Web Audio API buffer synthesis and VibrationEffect API, guaranteeing zero audio asset latency
 * and 100% offline availability across all browsers and devices.
 *
 * - playCorrectFeedback(): Mirrors Android SuperCollider additive bell synthesis (MIDI 72 -> 76 with 100ms spacing) + haptic tick
 * - playIncorrectFeedback(): Mirrors Android xylophone synthesis (MIDI 72 -> 66 with 500ms spacing) + haptic warning pulse
 * - playLessonCompleteFeedback(): Mirrors Android ToneGenerator sequence (TONE_PROP_BEEP 100ms -> delay 120ms -> TONE_PROP_BEEP 100ms -> delay 120ms -> TONE_PROP_ACK 300ms)
 * - playClick(): Instant tactile click for UI button interactions
 */

export const SOUND_CONSTANTS = {
  BELL_EVENT_DURATION_MS: 100,
  XYLOPHONE_EVENT_DURATION_MS: 500,
  CORRECT_FEEDBACK_GAIN: 0.8,
  INCORRECT_FEEDBACK_GAIN: 0.9,
  SAMPLE_RATE: 44100,
  BELL_ATTACK_MS: 25,
  BELL_RELEASE_MS: 1000,
  XYLOPHONE_ATTACK_MS: 25,
  XYLOPHONE_RELEASE_MS: 500,
  BELL_PARTIAL_RATIOS: [1.0, 3.997, 9.469, 15.566, 20.863, 29.440] as const,
  BELL_PARTIAL_AMPLITUDES: [1.0, 1.0 / 4.0, 1.0 / 9.0, 1.0 / 16.0, 1.0 / 25.0, 1.0 / 36.0] as const,
  XYLOPHONE_PARTIAL_RATIOS: [1.0, 3.932, 9.538, 16.688, 24.566, 31.147] as const,
  XYLOPHONE_PARTIAL_AMPLITUDES: [1.0, 1.0 / 4.0, 1.0 / 9.0, 1.0 / 16.0, 1.0 / 25.0, 1.0 / 36.0] as const,
} as const;

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Triggers hardware-level tactile vibration if supported by the client browser (e.g. Chrome/Firefox on mobile).
 * Exact timing mirrors Android's VibrationEffect:
 * - Error: Waveform timings [0, 60, 80, 100] -> vibrate 60ms, wait 80ms, vibrate 100ms
 * - Success: One-shot 45ms tick
 */
export function performHaptic(isError: boolean): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    if (isError) {
      navigator.vibrate([60, 80, 100]);
    } else {
      navigator.vibrate(45);
    }
  } catch {
    // Silently ignore if blocked by browser autoplay/vibrate policy
  }
}

/**
 * Synthesizes PCM bell samples matching Android's SoundFeedbackManager.playBellTone:
 * SuperCollider additive synthesis model with 6 harmonic partials, 25ms attack ramp,
 * exponential release decay over 1000ms.
 */
export function synthesizeBellSamples(
  midiNote: number,
  sampleRate: number = SOUND_CONSTANTS.SAMPLE_RATE
): Float32Array {
  const attackDurationMs = SOUND_CONSTANTS.BELL_ATTACK_MS;
  const releaseDurationMs = SOUND_CONSTANTS.BELL_RELEASE_MS;
  const sampleCount = Math.floor((sampleRate * (attackDurationMs + releaseDurationMs)) / 1000);
  const samples = new Float32Array(sampleCount);
  const fundamental = 440.0 * Math.pow(2.0, (midiNote - 69) / 12.0);
  const attackSec = attackDurationMs / 1000.0;
  const releaseSec = releaseDurationMs / 1000.0;
  const ratios = SOUND_CONSTANTS.BELL_PARTIAL_RATIOS;
  const amplitudes = SOUND_CONSTANTS.BELL_PARTIAL_AMPLITUDES;
  const gain = SOUND_CONSTANTS.CORRECT_FEEDBACK_GAIN;

  for (let index = 0; index < sampleCount; index++) {
    const time = index / sampleRate;
    const attack = Math.min(1.0, time / attackSec);
    const releaseProgress = Math.max(0.0, Math.min(1.0, (time - attackSec) / releaseSec));
    const envelope = releaseProgress === 0.0 ? attack : attack * Math.exp(-6.0 * releaseProgress);
    let value = 0.0;

    for (let p = 0; p < ratios.length; p++) {
      value += amplitudes[p] * Math.sin(2.0 * Math.PI * fundamental * ratios[p] * time);
    }

    const floatVal = value * envelope * gain;
    samples[index] = Math.max(-1.0, Math.min(1.0, floatVal));
  }

  return samples;
}

/**
 * Synthesizes PCM xylophone samples matching Android's SoundFeedbackManager.playXylophoneTone:
 * Additive synthesis with 6 xylophone partials, 25ms attack, exponential release decay over 500ms.
 */
export function synthesizeXylophoneSamples(
  midiNote: number,
  sampleRate: number = SOUND_CONSTANTS.SAMPLE_RATE
): Float32Array {
  const attackDurationMs = SOUND_CONSTANTS.XYLOPHONE_ATTACK_MS;
  const releaseDurationMs = SOUND_CONSTANTS.XYLOPHONE_RELEASE_MS;
  const sampleCount = Math.floor((sampleRate * (attackDurationMs + releaseDurationMs)) / 1000);
  const samples = new Float32Array(sampleCount);
  const fundamental = 440.0 * Math.pow(2.0, (midiNote - 69) / 12.0);
  const attackSec = attackDurationMs / 1000.0;
  const releaseSec = releaseDurationMs / 1000.0;
  const ratios = SOUND_CONSTANTS.XYLOPHONE_PARTIAL_RATIOS;
  const amplitudes = SOUND_CONSTANTS.XYLOPHONE_PARTIAL_AMPLITUDES;
  const gain = SOUND_CONSTANTS.INCORRECT_FEEDBACK_GAIN;

  for (let index = 0; index < sampleCount; index++) {
    const time = index / sampleRate;
    const attack = Math.min(1.0, time / attackSec);
    const releaseProgress = Math.max(0.0, Math.min(1.0, (time - attackSec) / releaseSec));
    const envelope = releaseProgress === 0.0 ? attack : attack * Math.exp(-6.0 * releaseProgress);
    let value = 0.0;

    for (let p = 0; p < ratios.length; p++) {
      value += amplitudes[p] * Math.sin(2.0 * Math.PI * fundamental * ratios[p] * time);
    }

    const floatVal = value * envelope * gain;
    samples[index] = Math.max(-1.0, Math.min(1.0, floatVal));
  }

  return samples;
}

/**
 * Synthesizes pure supervisory tone(s) matching Android's ToneGenerator (TONE_PROP_BEEP, TONE_PROP_ACK).
 */
export function synthesizeToneSamples(
  frequencies: number[],
  durationMs: number,
  sampleRate: number = SOUND_CONSTANTS.SAMPLE_RATE,
  gain: number = 0.7
): Float32Array {
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  const samples = new Float32Array(sampleCount);
  const durationSec = durationMs / 1000.0;
  const attackSec = Math.min(0.005, durationSec * 0.1);
  const decaySec = Math.min(0.008, durationSec * 0.1);

  for (let index = 0; index < sampleCount; index++) {
    const time = index / sampleRate;
    const attack = Math.min(1.0, time / attackSec);
    const decay = Math.min(1.0, (durationSec - time) / decaySec);
    const envelope = Math.min(attack, decay);

    let sum = 0.0;
    for (let f = 0; f < frequencies.length; f++) {
      sum += Math.sin(2.0 * Math.PI * frequencies[f] * time);
    }
    const val = (sum / frequencies.length) * envelope * gain;
    samples[index] = Math.max(-1.0, Math.min(1.0, val));
  }

  return samples;
}

/**
 * Synthesizes a crisp tactile click pop for UI interactions.
 */
export function synthesizeClickSamples(
  sampleRate: number = SOUND_CONSTANTS.SAMPLE_RATE
): Float32Array {
  const durationMs = 30;
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  const samples = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index++) {
    const time = index / sampleRate;
    // Rapid downward pitch drop from 1200Hz to 400Hz with exponential decay
    const freq = 400 + 800 * Math.exp(-time / 0.004);
    const envelope = Math.exp(-time / 0.007);
    const val = Math.sin(2.0 * Math.PI * freq * time) * envelope * 0.25;
    samples[index] = Math.max(-1.0, Math.min(1.0, val));
  }

  return samples;
}

function createAudioBufferFromSamples(
  ctx: AudioContext,
  samples: Float32Array,
  sampleRate: number
): AudioBuffer {
  const buffer = ctx.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);
  return buffer;
}

function playBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  startTime: number,
  volume: number = 1.0
): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, startTime);
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(startTime);
  return source;
}

/**
 * SoundFeedbackManager:
 * High-performance, offline-native sound feedback system ported from the Wikingo Android App.
 */
export class SoundFeedbackManager {
  private _isSoundEnabled: boolean = true;
  private bufferCache = new Map<string, AudioBuffer>();

  public setSoundEnabled(enabled: boolean): void {
    this._isSoundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this._isSoundEnabled;
  }

  public clearCache(): void {
    this.bufferCache.clear();
  }

  private getOrCreateBuffer(
    ctx: AudioContext,
    cacheKey: string,
    generator: (sampleRate: number) => Float32Array
  ): AudioBuffer {
    const fullKey = `${cacheKey}_${ctx.sampleRate}`;
    let buffer = this.bufferCache.get(fullKey);
    if (!buffer) {
      const samples = generator(ctx.sampleRate);
      buffer = createAudioBufferFromSamples(ctx, samples, ctx.sampleRate);
      this.bufferCache.set(fullKey, buffer);
    }
    return buffer;
  }

  public getBellBuffer(ctx: AudioContext, midiNote: number): AudioBuffer {
    return this.getOrCreateBuffer(ctx, `bell_${midiNote}`, (rate) =>
      synthesizeBellSamples(midiNote, rate)
    );
  }

  public getXylophoneBuffer(ctx: AudioContext, midiNote: number): AudioBuffer {
    return this.getOrCreateBuffer(ctx, `xylo_${midiNote}`, (rate) =>
      synthesizeXylophoneSamples(midiNote, rate)
    );
  }

  public getBeepBuffer(ctx: AudioContext): AudioBuffer {
    return this.getOrCreateBuffer(ctx, 'tone_beep_1200_100', (rate) =>
      synthesizeToneSamples([1200], 100, rate, 0.7)
    );
  }

  public getAckBuffer(ctx: AudioContext): AudioBuffer {
    return this.getOrCreateBuffer(ctx, 'tone_ack_300_400_500_300', (rate) =>
      synthesizeToneSamples([300, 400, 500], 300, rate, 0.75)
    );
  }

  public getClickBuffer(ctx: AudioContext): AudioBuffer {
    return this.getOrCreateBuffer(ctx, 'click_pop', (rate) =>
      synthesizeClickSamples(rate)
    );
  }

  /**
   * Plays cheerful ascending chime on correct answer + tactile click haptic.
   * Mirrors Android SoundFeedbackManager.playCorrectFeedback():
   * Two bell events spaced by BELL_EVENT_DURATION_MS = 100ms (MIDI 72 and MIDI 76).
   */
  public playCorrectFeedback(): void {
    performHaptic(false);
    if (!this._isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const b72 = this.getBellBuffer(ctx, 72);
      const b76 = this.getBellBuffer(ctx, 76);
      playBuffer(ctx, b72, now);
      playBuffer(ctx, b76, now + SOUND_CONSTANTS.BELL_EVENT_DURATION_MS / 1000);
    } catch {
      // Audio playback silently ignored if blocked by autoplay policy
    }
  }

  /**
   * Plays dull alert/buzzer on wrong answer + warning double-pulse haptic.
   * Mirrors Android SoundFeedbackManager.playIncorrectFeedback():
   * Two xylophone events spaced by XYLOPHONE_EVENT_DURATION_MS = 500ms (MIDI 72 and MIDI 66).
   */
  public playIncorrectFeedback(): void {
    performHaptic(true);
    if (!this._isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const x72 = this.getXylophoneBuffer(ctx, 72);
      const x66 = this.getXylophoneBuffer(ctx, 66);
      playBuffer(ctx, x72, now);
      playBuffer(ctx, x66, now + SOUND_CONSTANTS.XYLOPHONE_EVENT_DURATION_MS / 1000);
    } catch {
      // Audio playback silently ignored if blocked by autoplay policy
    }
  }

  /**
   * Plays triumphant fanfare on lesson completion + haptic tick.
   * Mirrors Android SoundFeedbackManager.playLessonCompleteFeedback():
   * TONE_PROP_BEEP (100ms) -> delay 120ms -> TONE_PROP_BEEP (100ms) -> delay 120ms -> TONE_PROP_ACK (300ms).
   */
  public playLessonCompleteFeedback(): void {
    performHaptic(false);
    if (!this._isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const beep = this.getBeepBuffer(ctx);
      const ack = this.getAckBuffer(ctx);
      playBuffer(ctx, beep, now);
      playBuffer(ctx, beep, now + 0.12);
      playBuffer(ctx, ack, now + 0.24);
    } catch {
      // Audio playback silently ignored if blocked by autoplay policy
    }
  }

  /**
   * Plays tactile click / pop when selecting an option or tapping a node.
   */
  public playClick(): void {
    performHaptic(false);
    if (!this._isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const click = this.getClickBuffer(ctx);
      playBuffer(ctx, click, now);
    } catch {
      // Audio playback silently ignored if blocked by autoplay policy
    }
  }

  /**
   * Plays individual bell tone for arbitrary MIDI note.
   */
  public playBellTone(midiNote: number, delaySec: number = 0): void {
    if (!this._isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const buffer = this.getBellBuffer(ctx, midiNote);
      playBuffer(ctx, buffer, ctx.currentTime + delaySec);
    } catch {}
  }

  /**
   * Plays individual xylophone tone for arbitrary MIDI note.
   */
  public playXylophoneTone(midiNote: number, delaySec: number = 0): void {
    if (!this._isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const buffer = this.getXylophoneBuffer(ctx, midiNote);
      playBuffer(ctx, buffer, ctx.currentTime + delaySec);
    } catch {}
  }

  // --- Aliases for backward compatibility with existing web-app components ---
  public playSuccess(): void {
    this.playCorrectFeedback();
  }

  public playError(): void {
    this.playIncorrectFeedback();
  }

  public playVictory(): void {
    this.playLessonCompleteFeedback();
  }
}

export const soundManager = new SoundFeedbackManager();
export default soundManager;
