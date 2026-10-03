import { describe, it, expect, beforeEach } from 'vitest';
import { useQuizStore } from '@/store/useQuizStore';

describe('Hearts Manager (Parity with Android HeartsManager.kt)', () => {
  beforeEach(() => {
    useQuizStore.setState({
      lives: 10,
      maxLives: 10,
      lastLifeLostAt: null,
      nextRechargeAtMillis: null,
    });
  });

  it('should initialize with MAX_HEARTS = 10 and null nextRechargeAtMillis', () => {
    const state = useQuizStore.getState();
    expect(state.lives).toBe(10);
    expect(state.maxLives).toBe(10);
    expect(state.lastLifeLostAt).toBeNull();
    expect(state.nextRechargeAtMillis).toBeNull();
  });

  it('should schedule next recharge 2 hours after a heart is lost', () => {
    const store = useQuizStore.getState();
    const fakeQuestion = {
      id: 'q1',
      type: 'multiple_choice' as const,
      prompt: 'Test prompt',
      article: {
        pageid: 1,
        title: 'Test',
        extract: 'Test extract',
        lang: 'it' as const,
        type: 'standard',
        content_urls: { desktop: { page: 'https://it.wikipedia.org' } },
      },
      options: [
        { id: 'opt1', text: 'Correct', isCorrect: true },
        { id: 'opt2', text: 'Wrong', isCorrect: false },
      ],
      correctOptionId: 'opt1',
      explanation: 'Explanation',
      sourceUrl: 'https://it.wikipedia.org',
    };

    store.startRound([fakeQuestion]);
    store.selectOption('opt2');
    store.checkAnswer();

    const state = useQuizStore.getState();
    expect(state.lives).toBe(9);
    expect(state.lastLifeLostAt).toBeTypeOf('number');
    expect(state.nextRechargeAtMillis).toBeTypeOf('number');

    // nextRechargeAtMillis should be exactly 2 hours after lastLifeLostAt
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    expect(state.nextRechargeAtMillis).toBe(state.lastLifeLostAt! + TWO_HOURS_MS);
  });

  it('should recharge 1 heart after 2 hours elapsed and update nextRechargeAtMillis', () => {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    useQuizStore.setState({
      lives: 8,
      lastLifeLostAt: now - TWO_HOURS_MS,
      nextRechargeAtMillis: now,
    });

    useQuizStore.getState().checkLifeRecharge();

    const state = useQuizStore.getState();
    expect(state.lives).toBe(9);
    expect(state.lastLifeLostAt).toBe(now);
    expect(state.nextRechargeAtMillis).toBe(now + TWO_HOURS_MS);
  });

  it('should recharge multiple hearts if multiple 2-hour intervals elapsed', () => {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    // 6 hours ago = 3 hearts recharged
    useQuizStore.setState({
      lives: 4,
      lastLifeLostAt: now - 6 * TWO_HOURS_MS / 2, // 6 hours
    });

    useQuizStore.getState().checkLifeRecharge();

    const state = useQuizStore.getState();
    expect(state.lives).toBe(7); // 4 + 3 = 7
    expect(state.nextRechargeAtMillis).toBe(state.lastLifeLostAt! + TWO_HOURS_MS);
  });

  it('should cap recharge at MAX_HEARTS (10) and clear timers', () => {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    useQuizStore.setState({
      lives: 8,
      lastLifeLostAt: now - 10 * TWO_HOURS_MS, // 20 hours ago
    });

    useQuizStore.getState().checkLifeRecharge();

    const state = useQuizStore.getState();
    expect(state.lives).toBe(10);
    expect(state.lastLifeLostAt).toBeNull();
    expect(state.nextRechargeAtMillis).toBeNull();
  });

  it('should restore all 10 lives on restoreLives() call', () => {
    useQuizStore.setState({
      lives: 0,
      lastLifeLostAt: Date.now(),
      nextRechargeAtMillis: Date.now() + 2 * 3600 * 1000,
    });

    useQuizStore.getState().restoreLives();

    const state = useQuizStore.getState();
    expect(state.lives).toBe(10);
    expect(state.maxLives).toBe(10);
    expect(state.lastLifeLostAt).toBeNull();
    expect(state.nextRechargeAtMillis).toBeNull();
  });
});
