/*
  This file is part of Wikingo
  <https://github.com/aresthebellator/HackathonMessina2026-WebApp>.
  Copyright (c) 2026 aresthebellator (exertia group).

  SPDX-License-Identifier: MIT
  Licensed under the MIT License. See the LICENSE file in the project root
  for the full license text.
*/

import { describe, it, expect, beforeEach } from 'vitest';
import { computeShouldOfferDeepening } from '@/lib/utils';
import { i18n } from '@/lib/i18n';
import { useQuizStore } from '@/store/useQuizStore';

describe('Deepening and Topic Help (Parity with Android TrainerScreen)', () => {
  describe('computeShouldOfferDeepening heuristic (Android Question.kt Parity)', () => {
    it('should return true when prompt text is long (> 180 chars)', () => {
      const longPrompt = 'A'.repeat(185);
      expect(computeShouldOfferDeepening(longPrompt, 'Short explanation', 'Short quote')).toBe(true);
    });

    it('should return true when explanation is long (> 220 chars)', () => {
      const longExplanation = 'B'.repeat(225);
      expect(computeShouldOfferDeepening('Short prompt', longExplanation, 'Short quote')).toBe(true);
    });

    it('should return true when wikiQuote is blank or empty', () => {
      expect(computeShouldOfferDeepening('Prompt', 'Explanation', '')).toBe(true);
      expect(computeShouldOfferDeepening('Prompt', 'Explanation', '   ')).toBe(true);
    });

    it('should return true when prompt contains trigger phrases like sconosciut, unknown, or general knowledge', () => {
      expect(computeShouldOfferDeepening('Un evento sconosciuto della storia antica', 'Explanation', 'Quote')).toBe(true);
      expect(computeShouldOfferDeepening('An unknown character in mythology', 'Explanation', 'Quote')).toBe(true);
      expect(computeShouldOfferDeepening('General knowledge question about science', 'Explanation', 'Quote')).toBe(true);
    });

    it('should return false when prompt and explanation are compact, wikiQuote is present, and no trigger phrases exist', () => {
      expect(computeShouldOfferDeepening('Chi è Galileo Galilei?', 'Un famoso astronomo italiano', 'Galileo Galilei è stato un astronomo')).toBe(false);
    });
  });

  describe('Translation Parity for Deepening & Topic Help', () => {
    it('should have exact Italian translations matching Android strings', () => {
      expect(i18n('trainer.deepen_question', 'it')).toBe('APPROFONDISCI QUESTA DOMANDA');
      expect(i18n('trainer.explain_topic', 'it')).toBe("CHE COS'È QUESTO ARGOMENTO?");
      expect(i18n('trainer.topic_help_unavailable', 'it')).toBe(
        'Non ho ancora una breve descrizione disponibile per questo argomento.'
      );
      expect(i18n('history.accuracy_label', 'it')).toBe('Precisione');
      expect(i18n('history.open_topic', 'it')).toBe('Apri voce');
    });

    it('should have exact English translations matching Android strings', () => {
      expect(i18n('trainer.deepen_question', 'en')).toBe('EXPLORE THIS QUESTION');
      expect(i18n('trainer.explain_topic', 'en')).toBe('WHAT IS THIS TOPIC?');
      expect(i18n('trainer.topic_help_unavailable', 'en')).toBe(
        'A short description is not available for this topic yet.'
      );
      expect(i18n('history.accuracy_label', 'en')).toBe('Accuracy');
      expect(i18n('history.open_topic', 'en')).toBe('Open article');
    });
  });

  describe('XP and Accuracy calculation parity with Android LessonSession', () => {
    beforeEach(() => {
      useQuizStore.setState({
        xp: 0,
        topicHistory: [],
      });
    });

    it('should compute accuracy and award bonus XP for >= 80% accuracy', () => {
      // 5 out of 5 correct (100% accuracy)
      // score * 10 = 50, bonus = 15 -> total = 65 XP
      useQuizStore.getState().recordTopicHistory({
        score: 5,
        totalQuestions: 5,
      });

      const item = useQuizStore.getState().topicHistory[0];
      expect(item.accuracy).toBe(100);
      expect(item.xpEarned).toBe(65);
    });

    it('should compute accuracy and award lower bonus for < 80% accuracy', () => {
      // 3 out of 5 correct (60% accuracy)
      // score * 10 = 30, bonus = 5 -> total = 35 XP
      useQuizStore.getState().recordTopicHistory({
        score: 3,
        totalQuestions: 5,
      });

      const item = useQuizStore.getState().topicHistory[0];
      expect(item.accuracy).toBe(60);
      expect(item.xpEarned).toBe(35);
    });
  });
});
