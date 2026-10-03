import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuizStore } from '@/store/useQuizStore';
import { fetchArticleBatch, fetchArticleForTopic, fetchRandomSummary } from '@/services/wikipedia';
import { generateQuizQuestions, generateQuestionsForArticle } from '@/services/quizGenerator';
import { getLessonTopic } from '@/lib/unitsData';
import { Question } from '@/types';

export function useWikipediaQuiz() {
  const queryClient = useQueryClient();
  const language = useQuizStore((s) => s.language);
  const startRound = useQuizStore((s) => s.startRound);
  const setLoadingRound = useQuizStore((s) => s.setLoadingRound);
  const isLoading = useQuizStore((s) => s.isLoadingRound);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Fetch an article for a specific numbered lesson according to its unit topic
   * and generate 5-7 micro-questions matching Android's QuestionGenerator.
   */
  const loadLesson = useCallback(
    async (lessonNumber: number, _count: number = 5): Promise<Question[]> => {
      setLoadingRound(true, lessonNumber);
      try {
        const specificTopic = getLessonTopic(lessonNumber, language);
        const cacheKey = ['wikipedia-lesson-article', lessonNumber, specificTopic, language];

        const article = await queryClient.fetchQuery({
          queryKey: cacheKey,
          queryFn: () => fetchArticleForTopic(specificTopic, language),
          staleTime: 1000 * 60 * 10,
        });

        const questions = generateQuestionsForArticle(article, language);
        startRound(questions, lessonNumber);
        return questions;
      } catch (err) {
        console.error('Failed to load lesson:', err);
        const specificTopic = getLessonTopic(lessonNumber, language);
        const fallbackArticle = await fetchArticleForTopic(specificTopic, language);
        const fallbackQuestions = generateQuestionsForArticle(fallbackArticle, language);
        startRound(fallbackQuestions, lessonNumber);
        return fallbackQuestions;
      } finally {
        setLoadingRound(false);
      }
    },
    [language, queryClient, setLoadingRound, startRound]
  );

  /**
   * Fetch a fresh random article lesson and generate questions matching Android's getRandomLessonUseCase
   */
  const loadNewRound = useCallback(
    async (count: number = 5): Promise<Question[]> => {
      setLoadingRound(true);
      try {
        const article = await fetchRandomSummary({ lang: language });
        const questions = generateQuestionsForArticle(article, language);
        startRound(questions);
        return questions;
      } catch (err) {
        console.error('Failed to load Wikipedia quiz round:', err);
        const fallbackArticles = await fetchArticleBatch(count, language);
        const fallbackQuestions = generateQuizQuestions(fallbackArticles);
        startRound(fallbackQuestions);
        return fallbackQuestions;
      } finally {
        setLoadingRound(false);
      }
    },
    [language, setLoadingRound, startRound]
  );

  /**
   * Pre-fetches the subsequent round in the background for zero-latency continuation
   */
  const prefetchNextRound = useCallback(
    async (count: number = 5) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['wikipedia-prefetch', language],
          queryFn: () => fetchArticleBatch(count, language),
          staleTime: 1000 * 60 * 5,
        });
      } catch {}
    },
    [language, queryClient]
  );

  return {
    loadLesson,
    loadNewRound,
    prefetchNextRound,
    isLoading,
    isOnline,
  };
}
