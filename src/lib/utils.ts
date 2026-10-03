import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fisher-Yates shuffle algorithm for impartial option randomization
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Format today's date in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check if date string was yesterday
 */
export function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prev = new Date(today);
  prev.setDate(prev.getDate() - 1);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  return target.getTime() === prev.getTime();
}

/**
 * Strip HTML tags from string if any
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Truncate long text cleanly at word boundaries
 */
export function truncateWords(text: string, maxChars: number = 180): string {
  if (!text || text.length <= maxChars) return text;
  const cut = text.substring(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.substring(0, lastSpace) : cut) + '...';
}

/**
 * Standard Java/Kotlin string hashCode implementation
 */
export function stringHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Mulberry32 seeded pseudo-random generator
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Impartial Fisher-Yates array shuffle using a deterministic PRNG
 */
export function shuffleArrayWithPrng<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Determines whether a question benefits from Wikipedia article deepening action.
 * Matches com.exertia.wikingo.domain.model.Question.shouldOfferDeepening in android-app.
 */
export function computeShouldOfferDeepening(
  prompt: string,
  explanation: string,
  wikiQuote?: string
): boolean {
  return (
    prompt.length > 180 ||
    explanation.length > 220 ||
    !wikiQuote ||
    wikiQuote.trim().length === 0 ||
    /sconosciut/i.test(prompt) ||
    /unknown/i.test(prompt) ||
    /general knowledge/i.test(prompt)
  );
}

