import { describe, it, expect } from 'vitest';
import {
  generateQuestionsForArticle,
  getCuratedOfflineSummary,
  ITALIAN_BIOGRAPHICAL_DISTRACTORS,
  ITALIAN_GEOGRAPHICAL_DISTRACTORS,
  ENGLISH_BIOGRAPHICAL_DISTRACTORS,
} from '@/services/quizGenerator';
import { OFFLINE_ARTICLES_IT, OFFLINE_ARTICLES_EN } from '@/lib/offlinePool';
import { Article } from '@/types';

describe('Question Generator Parity with Android QuestionGenerator.kt', () => {
  it('should generate between 5 and 7 questions for a single article', () => {
    const article = OFFLINE_ARTICLES_IT[0]; // Leonardo da Vinci
    const questions = generateQuestionsForArticle(article, 'it');

    expect(questions.length).toBeGreaterThanOrEqual(5);
    expect(questions.length).toBeLessThanOrEqual(7);

    questions.forEach((q) => {
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correctOptionId).toBeTruthy();
      expect(q.options.some((opt) => opt.id === q.correctOptionId && opt.isCorrect)).toBe(true);
      expect(q.explanation).toBeTruthy();
      expect(q.wikiQuote).toBeTruthy();
      expect(typeof q.shouldOfferDeepening).toBe('boolean');
    });
  });

  it('should be deterministic for the same article and language (PRNG seed parity)', () => {
    const article = OFFLINE_ARTICLES_IT[1]; // Colosseo
    const run1 = generateQuestionsForArticle(article, 'it');
    const run2 = generateQuestionsForArticle(article, 'it');

    expect(run1.length).toBe(run2.length);
    for (let i = 0; i < run1.length; i++) {
      expect(run1[i].prompt).toBe(run2[i].prompt);
      expect(run1[i].correctOptionId).toBe(run2[i].correctOptionId);
      expect(run1[i].options.map((o) => o.text)).toEqual(run2[i].options.map((o) => o.text));
    }
  });

  it('should include identity question and pool distractors for Italian articles', () => {
    const bioArticle: Article = {
      pageid: 12345,
      title: 'Galileo Galilei',
      displaytitle: 'Galileo Galilei',
      description: 'Fisico, astronomo, filosofo e matematico italiano',
      extract: 'Galileo Galilei è stato un fisico, astronomo, filosofo e matematico italiano, considerato il padre della scienza moderna.',
      content_urls: { desktop: { page: 'https://it.wikipedia.org/wiki/Galileo_Galilei' } },
      lang: 'it',
      type: 'standard',
    };

    const questions = generateQuestionsForArticle(bioArticle, 'it');
    const identityQ = questions.find((q) => q.prompt.includes('identifica meglio'));
    expect(identityQ).toBeDefined();

    // Check that at least one distractor comes from the Italian distractor pools
    const optionTexts = identityQ!.options.map((o) => o.text);
    const hasDistractorFromPool = optionTexts.some((text) =>
      ITALIAN_BIOGRAPHICAL_DISTRACTORS.includes(text) || ITALIAN_GEOGRAPHICAL_DISTRACTORS.includes(text)
    );
    expect(hasDistractorFromPool).toBe(true);
  });

  it('should support English articles and select English category distractors', () => {
    const enArticle = OFFLINE_ARTICLES_EN[0]; // Albert Einstein
    const questions = generateQuestionsForArticle(enArticle, 'en');

    expect(questions.length).toBeGreaterThanOrEqual(5);
    const identityQ = questions.find((q) => q.prompt.includes('best identifies'));
    expect(identityQ).toBeDefined();

    const optionTexts = identityQ!.options.map((o) => o.text);
    const hasEnDistractor = optionTexts.some((text) => ENGLISH_BIOGRAPHICAL_DISTRACTORS.includes(text));
    expect(hasEnDistractor).toBe(true);
  });

  it('should generate context question with historical year extraction when year is present', () => {
    const yearArticle: Article = {
      pageid: 34567,
      title: 'Presa della Bastiglia',
      displaytitle: 'Presa della Bastiglia',
      description: 'Evento storico della Rivoluzione Francese',
      extract: 'La presa della Bastiglia avvenne il 14 luglio 1789 a Parigi, evento simbolo della Rivoluzione francese.',
      content_urls: { desktop: { page: 'https://it.wikipedia.org/wiki/Presa_della_Bastiglia' } },
      lang: 'it',
      type: 'standard',
    };

    const questions = generateQuestionsForArticle(yearArticle, 'it');
    const contextQ = questions.find((q) => q.prompt.includes('anno o periodo'));
    expect(contextQ).toBeDefined();

    // Correct option should be 1789
    const correctOpt = contextQ!.options.find((o) => o.id === contextQ!.correctOptionId);
    expect(correctOpt?.text).toBe('1789');
  });

  it('should provide curated offline summaries for all 12 predefined Italian topics', () => {
    const topics = [
      'Leonardo da Vinci',
      'Colosseo',
      'Stretto di Messina',
      'Telescopio Spaziale James Webb',
      'Acropoli di Atene',
      'Galileo Galilei',
      'Alpi',
      'Dante Alighieri',
      'Wolfgang Amadeus Mozart',
      'Cinema',
      'Biodiversità',
      'Intelligenza artificiale',
    ];

    topics.forEach((topic) => {
      const summary = getCuratedOfflineSummary(topic, 'it');
      expect(summary.title).toBe(topic);
      expect(summary.extract.length).toBeGreaterThan(60);
      expect(summary.description).toBeTruthy();
      expect(summary.content_urls.desktop.page).toContain('wikipedia.org');

      // Test question generation on curated summary
      const questions = generateQuestionsForArticle(summary, 'it');
      expect(questions.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('should provide a curated offline summary for dynamic English topics', () => {
    const summary = getCuratedOfflineSummary('Quantum Physics', 'en');
    expect(summary.title).toBe('Quantum Physics');
    expect(summary.extract).toContain('Quantum Physics');
    expect(summary.content_urls.desktop.page).toContain('en.wikipedia.org');

    const questions = generateQuestionsForArticle(summary, 'en');
    expect(questions.length).toBeGreaterThanOrEqual(5);
  });
});
