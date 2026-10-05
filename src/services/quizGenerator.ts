/*
  This file is part of Wikingo
  <https://github.com/aresthebellator/HackathonMessina2026-WebApp>.
  Copyright (c) 2026 aresthebellator (exertia group).

  SPDX-License-Identifier: MIT
  Licensed under the MIT License. See the LICENSE file in the project root
  for the full license text.
*/

import { Article, Question, QuestionOption, QuestionType } from '@/types';
import {
  shuffleArray,
  truncateWords,
  stringHashCode,
  createSeededRandom,
  shuffleArrayWithPrng,
  computeShouldOfferDeepening,
} from '@/lib/utils';

// Distractor pools ported directly from android-app/data/generator/QuestionGenerator.kt
export const ITALIAN_BIOGRAPHICAL_DISTRACTORS = [
  "Un matematico e astronomo dell'antica Grecia",
  "Un generale dell'impero persiano durante le guerre mediche",
  "Un pittore fiammingo del periodo barocco",
  "Un esploratore portoghese che circumnavigò l'Africa",
  "Un compositore classico austriaco del XVIII secolo",
  "Un filosofo illuminista francese autore di saggi politici",
  "Un pioniere dell'aviazione e ingegnere meccanico",
  "Un medico e biologo scopritore di vaccini moderni"
];

export const ITALIAN_GEOGRAPHICAL_DISTRACTORS = [
  "Un'isola vulcanica situata nell'arcipelago polinesiano",
  "Una catena montuosa che separa due continenti",
  "Un antico porto fluviale della Mesopotamia",
  "Una regione desertica dell'Africa subsahariana",
  "Una città costiera fondata dai coloni fenici",
  "Un ghiacciaio perenne situato nelle Alpi scandinave",
  "Un parco nazionale protetto nell'America centrale"
];

export const ITALIAN_SCIENCE_DISTRACTORS = [
  "Un principio fondamentale della termodinamica quantistica",
  "Un elemento chimico sintetizzato in laboratorio nel 1974",
  "Una cometa periodica visibile a occhio nudo ogni 76 anni",
  "Un processo biologico di fotosintesi anaerobica",
  "Una missione spaziale robotica inviata verso Giove",
  "Una teoria geologica sulla tettonica delle placche continentali"
];

export const ITALIAN_GENERAL_DISTRACTORS = [
  "Un trattato diplomatico firmato al termine della guerra dei trent'anni",
  "Un movimento artistico d'avanguardia nato a inizio Novecento",
  "Un manoscritto medievale conservato nella biblioteca vaticana",
  "Uno strumento musicale tradizionale a fiato",
  "Un'opera teatrale in versi scritta durante il Rinascimento"
];

export const ENGLISH_BIOGRAPHICAL_DISTRACTORS = [
  "A Greek mathematician and astronomer",
  "A Persian general during the Greco-Persian Wars",
  "A Flemish painter from the Baroque period",
  "A Portuguese explorer who sailed around Africa",
  "An Austrian classical composer from the 18th century",
  "A French Enlightenment philosopher and political essayist",
  "An aviation pioneer and mechanical engineer",
  "A physician and biologist who pioneered modern vaccines"
];

export const ENGLISH_GEOGRAPHICAL_DISTRACTORS = [
  "A volcanic island in the Polynesian archipelago",
  "A mountain range separating two continents",
  "An ancient river port in Mesopotamia",
  "A desert region in sub-Saharan Africa",
  "A coastal city founded by Phoenician settlers",
  "A permanent glacier in the Scandinavian Alps",
  "A protected national park in Central America"
];

export const ENGLISH_SCIENCE_DISTRACTORS = [
  "A fundamental principle of quantum thermodynamics",
  "A chemical element synthesized in a laboratory in 1974",
  "A periodic comet visible every 76 years",
  "An anaerobic photosynthesis process",
  "A robotic space mission sent toward Jupiter",
  "A geological theory about continental plate tectonics"
];

export const ENGLISH_GENERAL_DISTRACTORS = [
  "A diplomatic treaty signed at the end of the Thirty Years' War",
  "An avant-garde art movement born in the early 20th century",
  "A medieval manuscript kept in the Vatican Library",
  "A traditional wind instrument",
  "A Renaissance verse play"
];

function biographicalDistractors(language: string) {
  return language === 'en' ? ENGLISH_BIOGRAPHICAL_DISTRACTORS : ITALIAN_BIOGRAPHICAL_DISTRACTORS;
}

function geographicalDistractors(language: string) {
  return language === 'en' ? ENGLISH_GEOGRAPHICAL_DISTRACTORS : ITALIAN_GEOGRAPHICAL_DISTRACTORS;
}

function scienceDistractors(language: string) {
  return language === 'en' ? ENGLISH_SCIENCE_DISTRACTORS : ITALIAN_SCIENCE_DISTRACTORS;
}

function generalDistractors(language: string) {
  return language === 'en' ? ENGLISH_GENERAL_DISTRACTORS : ITALIAN_GENERAL_DISTRACTORS;
}

function phrase(language: string, italian: string, english: string): string {
  return language === 'en' ? english : italian;
}

function makeMultipleChoice(
  article: Article,
  prompt: string,
  correctText: string,
  distractors: string[],
  explanation: string,
  language: string,
  prng: () => number,
  categoryHint?: string
): Question {
  const filtered = distractors.filter(
    (d) => d && d.trim().length > 0 && d.trim().toLowerCase() !== correctText.trim().toLowerCase()
  );
  const uniqueDistractors = Array.from(new Set(filtered));
  const chosenDistractors = shuffleArrayWithPrng(uniqueDistractors, prng).slice(0, 3);

  const correctOption: QuestionOption = {
    id: `opt_${Math.abs(stringHashCode(prompt + correctText))}_correct`,
    text: correctText,
    isCorrect: true,
  };

  const distractorOptions: QuestionOption[] = chosenDistractors.map((text, idx) => ({
    id: `opt_${Math.abs(stringHashCode(prompt + text))}_dist_${idx}`,
    text,
    isCorrect: false,
  }));

  const allOptions = shuffleArrayWithPrng([correctOption, ...distractorOptions], prng);

  return {
    id: `q_${article.pageid}_${Math.abs(stringHashCode(prompt))}`,
    type: 'multiple_choice',
    article,
    prompt,
    options: allOptions,
    correctOptionId: correctOption.id,
    explanation,
    wikiQuote: explanation,
    sourceUrl: article.content_urls?.desktop?.page || `https://${language}.wikipedia.org`,
    categoryHint: categoryHint || (language === 'en' ? 'General Knowledge' : 'Cultura Generale'),
    shouldOfferDeepening: computeShouldOfferDeepening(prompt, explanation, explanation),
  };
}

/**
 * QuestionGenerator:
 * Generates 5 to 7 engaging, high-quality questions for a single Wikipedia summary,
 * matching Android's QuestionGenerator.kt algorithms, distractors, and deterministic PRNG.
 */
export function generateQuestionsForArticle(
  article: Article,
  language: 'it' | 'en' = (article.lang as 'it' | 'en') || 'it'
): Question[] {
  const title = article.title?.trim() || (language === 'en' ? 'Unknown subject' : 'Soggetto sconosciuto');
  const description = article.description || '';
  const extract = article.extract || '';

  // Extract candidate sentences
  const sentences = extract
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

  const rawFacts = [
    ...sentences,
    ...description.split(/[,;]/).map((s) => s.trim()),
  ];

  const facts = Array.from(
    new Set(
      rawFacts
        .map((f) => f.replace(/\.$/, '').trim())
        .filter((f) => f.length >= 24)
    )
  );

  // Deterministic PRNG seed matching Android: title.hashCode() * 31 + extract.hashCode() + language.hashCode()
  const seed = (stringHashCode(title) * 31 + stringHashCode(extract) + stringHashCode(language)) | 0;
  const prng = createSeededRandom(seed);

  const firstFact = facts[0] || (description || title);
  const secondFact = facts[1] || firstFact;
  const thirdFact = facts[2] || secondFact;

  // 1. Identity Question
  const identityQuestion = (() => {
    const correct = description.trim() || facts[0] || (language === 'en' ? 'an encyclopedic entry' : 'una voce enciclopedica');
    const correctFormatted = correct.charAt(0).toUpperCase() + correct.slice(1);
    const pool = [
      ...biographicalDistractors(language),
      ...geographicalDistractors(language),
      ...scienceDistractors(language),
      ...generalDistractors(language),
    ].filter((d) => d.toLowerCase() !== correct.toLowerCase());

    const promptText = phrase(
      language,
      `Quale descrizione identifica meglio «${title}»?`,
      `Which description best identifies “${title}”?`
    );
    const expl = facts[0] || correct;
    return makeMultipleChoice(
      article,
      promptText,
      correctFormatted,
      pool,
      expl,
      language,
      prng,
      phrase(language, 'Identificazione', 'Identification')
    );
  })();

  // 2. Evidence Question
  const evidenceQuestion = (() => {
    const alternatives = [...facts.slice(1), ...generalDistractors(language)];
    const promptText = phrase(
      language,
      `Quale informazione trova conferma nel riassunto di «${title}»?`,
      `Which detail is supported by the summary of “${title}”?`
    );
    return makeMultipleChoice(
      article,
      promptText,
      firstFact,
      alternatives,
      firstFact,
      language,
      prng,
      phrase(language, 'Dettaglio verificato', 'Verified Detail')
    );
  })();

  // 3. Relationship Question
  const relationshipQuestion = (() => {
    const correct = secondFact.slice(0, 110);
    const distractors = language === 'en'
      ? [firstFact, 'A detail not present in the article', 'An unsupported interpretation']
      : [firstFact, 'Un dettaglio non presente nella voce', "Un'interpretazione senza fonte"];
    const promptText = phrase(
      language,
      `Quale conseguenza o caratteristica è collegata a «${title}»?`,
      `Which consequence or characteristic is connected to “${title}”?`
    );
    return makeMultipleChoice(
      article,
      promptText,
      correct,
      distractors,
      secondFact,
      language,
      prng,
      phrase(language, 'Relazioni', 'Relationships')
    );
  })();

  // 4. True Fact Question
  const trueFactQuestion = (() => {
    const trimmed = firstFact.replace(/\.$/, '');
    const promptText = phrase(
      language,
      `Vero o Falso:\nSecondo Wikipedia, riguardo a '${title}': "${trimmed}".`,
      `True or False:\nAccording to Wikipedia, about '${title}': "${trimmed}".`
    );
    const trueLabel = phrase(language, 'Vero', 'True');
    const falseLabel = phrase(language, 'Falso', 'False');
    const options: QuestionOption[] = [
      { id: `opt_tf_${Math.abs(stringHashCode(promptText))}_true`, text: trueLabel, isCorrect: true },
      { id: `opt_tf_${Math.abs(stringHashCode(promptText))}_false`, text: falseLabel, isCorrect: false },
    ];
    const expl = phrase(
      language,
      `Esatto! Come riportato dalla voce di Wikipedia: "${firstFact}"`,
      `Correct! Wikipedia's article says: "${firstFact}"`
    );
    return {
      id: `q_${article.pageid}_tf_true`,
      type: 'true_false' as QuestionType,
      article,
      prompt: promptText,
      options,
      correctOptionId: options[0].id,
      explanation: expl,
      wikiQuote: firstFact,
      sourceUrl: article.content_urls?.desktop?.page || `https://${language}.wikipedia.org`,
      categoryHint: phrase(language, 'Vero o Falso', 'True or False'),
      shouldOfferDeepening: computeShouldOfferDeepening(promptText, expl, firstFact),
    };
  })();

  // 5. False Fact Question
  const falseFactQuestion = (() => {
    const fakeClaim = phrase(
      language,
      'è stato scoperto nel 2024 da una spedizione sottomarina alle Isole Figi',
      'was discovered in 2024 by an underwater expedition near Fiji'
    );
    const statement = `'${title}' ${fakeClaim}.`;
    const promptText = phrase(
      language,
      `Vero o Falso:\n"${statement}"`,
      `True or False:\n"${statement}"`
    );
    const trueLabel = phrase(language, 'Vero', 'True');
    const falseLabel = phrase(language, 'Falso', 'False');
    const options: QuestionOption[] = [
      { id: `opt_tf_${Math.abs(stringHashCode(promptText))}_true`, text: trueLabel, isCorrect: false },
      { id: `opt_tf_${Math.abs(stringHashCode(promptText))}_false`, text: falseLabel, isCorrect: true },
    ];
    const expl = phrase(
      language,
      `Falso! In realtà: "${thirdFact}"`,
      `False! In reality: "${thirdFact}"`
    );
    return {
      id: `q_${article.pageid}_tf_false`,
      type: 'true_false' as QuestionType,
      article,
      prompt: promptText,
      options,
      correctOptionId: options[1].id,
      explanation: expl,
      wikiQuote: thirdFact,
      sourceUrl: article.content_urls?.desktop?.page || `https://${language}.wikipedia.org`,
      categoryHint: phrase(language, 'Vero o Falso', 'True or False'),
      shouldOfferDeepening: computeShouldOfferDeepening(promptText, expl, thirdFact),
    };
  })();

  // 6. Context Question
  const contextQuestion = (() => {
    const yearMatch = extract.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    if (yearMatch) {
      const correctYear = parseInt(yearMatch[0], 10);
      const distractors = [
        (correctYear - 45).toString(),
        (correctYear + 32).toString(),
        (correctYear - 110).toString(),
      ];
      const quote = sentences.find((s) => s.includes(yearMatch[0])) || extract;
      const promptText = phrase(
        language,
        `In quale anno o periodo si colloca l'evento o la menzione storica di '${title}'?`,
        `Which year or period is associated with the event or historical reference to '${title}'?`
      );
      const expl = phrase(
        language,
        `Nel testo viene riportato: "${quote}"`,
        `The article reports: "${quote}"`
      );
      return makeMultipleChoice(
        article,
        promptText,
        correctYear.toString(),
        distractors,
        expl,
        language,
        prng,
        phrase(language, 'Contesto Storico', 'Historical Context')
      );
    }

    // When no year is available, ask about a concrete fact
    const correctFact = sentences[0]?.slice(0, 110) || extract.slice(0, 110) || title;
    const promptText = phrase(
      language,
      `Quale fatto concreto è riportato nella voce su '${title}'?`,
      `Which concrete fact is reported in the article about '${title}'?`
    );
    const alternatives = [...sentences.slice(1), ...generalDistractors(language)];
    return makeMultipleChoice(
      article,
      promptText,
      correctFact,
      alternatives,
      correctFact,
      language,
      prng,
      phrase(language, 'Fatto concreto', 'Concrete Fact')
    );
  })();

  const rawQuestions = [
    identityQuestion,
    evidenceQuestion,
    relationshipQuestion,
    trueFactQuestion,
    falseFactQuestion,
    contextQuestion,
  ];

  // Keep unique questions by prompt, return 5 to 7 questions
  const seenPrompts = new Set<string>();
  const questions: Question[] = [];
  for (const q of rawQuestions) {
    if (!seenPrompts.has(q.prompt)) {
      seenPrompts.add(q.prompt);
      questions.push(q);
    }
  }

  return questions.slice(0, 7);
}

/**
 * Curated offline fallback lessons guaranteeing 100% functionality without internet.
 * Ported directly from android-app/data/generator/QuestionGenerator.kt
 */
export function getCuratedOfflineSummary(
  topic?: string | null,
  language: 'it' | 'en' = 'it'
): Article {
  if (language === 'en') {
    const raw = (topic || '')
      .replace(/^🏆\s*/, '')
      .split(':')[0]
      .trim();
    const englishTopic = raw.length > 0 ? raw : 'General knowledge';
    const pageid = 900000 + Math.abs(stringHashCode(englishTopic));
    return {
      pageid,
      title: englishTopic,
      displaytitle: englishTopic,
      description: 'an encyclopedia topic selected for this lesson',
      extract: `${englishTopic} is a documented subject explored through Wikipedia. This lesson highlights its history, key ideas and real-world impact.`,
      lang: 'en',
      type: 'standard',
      content_urls: {
        desktop: {
          page: `https://en.wikipedia.org/wiki/${encodeURIComponent(englishTopic.replace(/\s+/g, '_'))}`,
        },
      },
    };
  }

  const fallbacks: Article[] = [
    {
      title: 'Leonardo da Vinci',
      displaytitle: 'Leonardo da Vinci',
      pageid: 1542,
      description: 'scienziato, inventore e artista italiano',
      extract:
        "Leonardo da Vinci è stato uno dei più grandi geni dell'umanità. Attivo nel Rinascimento come pittore, scienziato, ingegnere e scultore, ha realizzato capolavori immortali come la Gioconda e l'Ultima Cena, oltre a pionieristici studi di anatomia.",
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Leonardo_da_Vinci' },
      },
      thumbnail: {
        source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Leonardo_self.jpg/330px-Leonardo_self.jpg',
        width: 330,
        height: 450,
      },
    },
    {
      title: 'Colosseo',
      displaytitle: 'Colosseo',
      pageid: 3280,
      description: 'anfiteatro romano situato nel centro di Roma',
      extract:
        "Il Colosseo, originariamente noto come Anfiteatro Flavio, è il più grande anfiteatro del mondo. Situato nel centro storico di Roma, è stato inserito nel 1980 nella lista dei Patrimoni dell'umanità dell'UNESCO e fa parte delle nuove sette meraviglie del mondo.",
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Colosseo' },
      },
      thumbnail: {
        source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/330px-Colosseo_2020.jpg',
        width: 330,
        height: 220,
      },
    },
    {
      title: 'Stretto di Messina',
      displaytitle: 'Stretto di Messina',
      pageid: 8472,
      description: 'stretto marittimo che separa la Sicilia dalla Calabria',
      extract:
        'Lo Stretto di Messina è uno stretto che unisce il mar Tirreno con il mar Ionio e separa la Sicilia dalla penisola italiana. Caratterizzato da intense correnti di marea e da un ricco patrimonio mitologico legato ai mostri marini Scilla e Cariddi.',
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Stretto_di_Messina' },
      },
    },
    {
      title: 'Telescopio Spaziale James Webb',
      displaytitle: 'Telescopio Spaziale James Webb',
      pageid: 91823,
      description: 'grande telescopio spaziale a infrarossi per l\'astronomia',
      extract:
        "Il telescopio spaziale James Webb è un osservatorio spaziale sviluppato dalla NASA in collaborazione con l'ESA e la CSA. Lanciato nel dicembre 2021, opera in orbita attorno al punto di Lagrange L2 per osservare le prime galassie dell'universo.",
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/James_Webb_Space_Telescope' },
      },
    },
    {
      title: 'Acropoli di Atene',
      displaytitle: 'Acropoli di Atene',
      pageid: 125,
      description: 'cittadella monumentale dell\'antica Atene',
      extract:
        "L'Acropoli di Atene è una cittadella rocciosa che domina la capitale greca. Il Partenone, costruito nel V secolo avanti Cristo, è il suo monumento più celebre e uno dei simboli dell'architettura classica.",
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Acropoli_di_Atene' },
      },
    },
    {
      title: 'Galileo Galilei',
      displaytitle: 'Galileo Galilei',
      pageid: 1354,
      description: 'astronomo, fisico e matematico italiano',
      extract:
        "Galileo Galilei è stato un astronomo, fisico e matematico italiano. Con le sue osservazioni telescopiche sostenne l'astronomia eliocentrica e contribuì allo sviluppo del metodo sperimentale.",
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Galileo_Galilei' },
      },
    },
    {
      title: 'Alpi',
      displaytitle: 'Alpi',
      pageid: 2361,
      description: 'sistema montuoso dell\'Europa centrale',
      extract:
        'Le Alpi sono una catena montuosa dell\'Europa centrale che attraversa diversi Paesi. Il Monte Bianco è la vetta più alta e la regione alpina ospita ambienti, culture e paesaggi molto diversi.',
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Alpi' },
      },
    },
    {
      title: 'Dante Alighieri',
      displaytitle: 'Dante Alighieri',
      pageid: 816,
      description: 'poeta e scrittore italiano del Medioevo',
      extract:
        'Dante Alighieri è stato un poeta e scrittore italiano. La Divina Commedia, composta nel Medioevo, racconta il viaggio immaginario del poeta attraverso Inferno, Purgatorio e Paradiso.',
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Dante_Alighieri' },
      },
    },
    {
      title: 'Wolfgang Amadeus Mozart',
      displaytitle: 'Wolfgang Amadeus Mozart',
      pageid: 206,
      description: 'compositore e musicista austriaco',
      extract:
        'Wolfgang Amadeus Mozart è stato un compositore e musicista austriaco del XVIII secolo. La sua produzione comprende opere, sinfonie, concerti e musica da camera, ancora oggi eseguiti in tutto il mondo.',
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart' },
      },
    },
    {
      title: 'Cinema',
      displaytitle: 'Cinema',
      pageid: 5842,
      description: 'arte e industria delle immagini in movimento',
      extract:
        "Il cinema è l'arte di rappresentare storie e idee attraverso immagini in movimento. Nato tra la fine dell'Ottocento e l'inizio del Novecento, è diventato una delle forme culturali più diffuse al mondo.",
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Cinema' },
      },
    },
    {
      title: 'Biodiversità',
      displaytitle: 'Biodiversità',
      pageid: 532,
      description: 'varietà della vita sulla Terra',
      extract:
        'La biodiversità indica la varietà degli organismi viventi, degli ecosistemi e dei patrimoni genetici. La sua conservazione è importante per l\'equilibrio naturale e per il benessere delle società umane.',
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Biodiversit%C3%A0' },
      },
    },
    {
      title: 'Intelligenza artificiale',
      displaytitle: 'Intelligenza artificiale',
      pageid: 198,
      description: 'disciplina che studia sistemi capaci di svolgere compiti intelligenti',
      extract:
        "L'intelligenza artificiale è la disciplina che studia metodi e sistemi capaci di svolgere compiti associati all'intelligenza umana. Comprende apprendimento automatico, elaborazione del linguaggio e visione artificiale.",
      lang: 'it',
      type: 'standard',
      content_urls: {
        desktop: { page: 'https://it.wikipedia.org/wiki/Intelligenza_artificiale' },
      },
    },
  ];

  const normalizedTopic = (topic || '').trim().toLowerCase();
  const match = fallbacks.find((summary) => {
    if (!normalizedTopic) return false;
    if (summary.title.toLowerCase() === normalizedTopic) return true;
    const searchable = `${summary.title} ${summary.description || ''} ${summary.extract}`.toLowerCase();
    if (searchable.includes(normalizedTopic)) return true;
    return normalizedTopic
      .split(/\s+/)
      .some((word) => word.length >= 3 && searchable.includes(word));
  });

  return match || fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// -------------------------------------------------------------
// Backwards-compatible multi-article generators (for Quick Quiz)
// -------------------------------------------------------------

function maskTitleInText(text: string, title: string, lang: 'it' | 'en'): string {
  const cleanTitle = title.replace(/\s*\(.*?\)\s*/g, '').trim();
  const escaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  const replacement = lang === 'it' ? '«Questo soggetto»' : '«This subject»';
  let masked = text.replace(regex, replacement);
  masked = masked.replace(new RegExp(`^${escaped}`, 'gi'), replacement);
  return masked;
}

export function generateSubjectRecognitionQuestion(
  article: Article,
  allArticles: Article[],
  index: number = 0
): Question {
  const isIt = article.lang === 'it';
  const maskedExtract = maskTitleInText(article.extract, article.title, article.lang);
  const snippet = truncateWords(maskedExtract, 180);

  const prompt = isIt
    ? `A quale voce o entità di Wikipedia corrisponde questa descrizione?`
    : `Which Wikipedia subject corresponds to this description?`;

  const correctOption: QuestionOption = {
    id: `opt_${index}_correct`,
    text: article.title,
    isCorrect: true,
  };

  const otherTitles = allArticles
    .filter((a) => a.pageid !== article.pageid && a.title.toLowerCase() !== article.title.toLowerCase())
    .map((a) => a.title);

  const fallbackTitles = isIt
    ? ['Leonardo da Vinci', 'Colosseo', 'Margherita Hack', 'Sistema Solare', 'Dante Alighieri', 'Galileo Galilei']
    : ['Isaac Newton', 'Ancient Rome', 'James Webb Space Telescope', 'Albert Einstein', 'Marie Curie'];

  const distractorCandidates = Array.from(new Set([...otherTitles, ...fallbackTitles]))
    .filter((t) => t.toLowerCase() !== article.title.toLowerCase());

  const chosenDistractors = shuffleArray(distractorCandidates).slice(0, 3);
  const distractorOptions: QuestionOption[] = chosenDistractors.map((text, idx) => ({
    id: `opt_${index}_dist_${idx}`,
    text,
    isCorrect: false,
  }));

  const options = shuffleArray([correctOption, ...distractorOptions]);
  const explanation = isIt
    ? `Si tratta di "${article.title}". ${article.extract}`
    : `This refers to "${article.title}". ${article.extract}`;

  return {
    id: `q_${article.pageid}_subject`,
    type: 'subject_recognition',
    article,
    prompt,
    clozeContext: {
      before: snippet,
      blank: article.title,
      after: '',
      fullSentence: article.extract,
    },
    options,
    correctOptionId: correctOption.id,
    explanation,
    wikiQuote: article.extract,
    sourceUrl: article.content_urls.desktop.page,
    categoryHint: article.description || (isIt ? 'Cultura Generale' : 'General Knowledge'),
    shouldOfferDeepening: computeShouldOfferDeepening(prompt, explanation, article.extract),
  };
}

function generateMultipleChoiceQuestion(
  article: Article,
  allArticles: Article[],
  index: number
): Question {
  const isIt = article.lang === 'it';
  const prompt = isIt
    ? `Cosa definisce o chi è "${article.title}"?`
    : `What defines or who is "${article.title}"?`;

  let correctText = article.description;
  if (!correctText || correctText.length < 10) {
    const firstSentence = article.extract.split('.')[0];
    const cleanTitle = article.title.replace(/\s*\(.*?\)\s*/g, '').trim();
    correctText = firstSentence.replace(new RegExp(`^${cleanTitle}\\s*(è|era|stato|stata|is|was)?\\s*`, 'i'), '').trim();
    if (correctText.length > 75) correctText = truncateWords(correctText, 75);
  }
  correctText = correctText.charAt(0).toUpperCase() + correctText.slice(1);

  const correctOption: QuestionOption = {
    id: `opt_${index}_correct`,
    text: correctText,
    isCorrect: true,
  };

  const otherDescriptions = allArticles
    .filter((a) => a.pageid !== article.pageid && a.description)
    .map((a) => a.description!.charAt(0).toUpperCase() + a.description!.slice(1));

  const fallbackPool = isIt ? ITALIAN_BIOGRAPHICAL_DISTRACTORS : ENGLISH_BIOGRAPHICAL_DISTRACTORS;
  const distractorCandidates = Array.from(new Set([...otherDescriptions, ...fallbackPool]));
  const chosenDistractors = shuffleArray(distractorCandidates).slice(0, 3);

  const distractorOptions: QuestionOption[] = chosenDistractors.map((text, idx) => ({
    id: `opt_${index}_dist_${idx}`,
    text,
    isCorrect: false,
  }));

  const options = shuffleArray([correctOption, ...distractorOptions]);
  const explanation = `"${article.title}": ${article.extract}`;

  return {
    id: `q_${article.pageid}_mc`,
    type: 'multiple_choice',
    article,
    prompt,
    options,
    correctOptionId: correctOption.id,
    explanation,
    wikiQuote: article.extract,
    sourceUrl: article.content_urls.desktop.page,
    categoryHint: isIt ? 'Definizioni' : 'Definitions',
    shouldOfferDeepening: computeShouldOfferDeepening(prompt, explanation, article.extract),
  };
}

function generateClozeQuestion(
  article: Article,
  allArticles: Article[],
  index: number
): Question {
  const isIt = article.lang === 'it';
  const sentences = article.extract.split(/(?<=[.!?])\s+/);
  const sentence = sentences[0] || article.extract;

  const stopWordsIt = new Set(['questo', 'questa', 'quello', 'quella', 'essere', 'stato', 'stata', 'della', 'delle', 'degli', 'anche', 'hanno', 'nella', 'nelle']);
  const stopWordsEn = new Set(['which', 'there', 'their', 'about', 'would', 'could', 'after', 'where', 'being', 'under']);
  const stopWords = isIt ? stopWordsIt : stopWordsEn;

  const words = sentence.split(/\s+/);
  const candidates = words
    .map((w, i) => ({ word: w.replace(/[^\w\u00C0-\u017F]/g, ''), raw: w, index: i }))
    .filter((c) => c.word.length >= 5 && !stopWords.has(c.word.toLowerCase()));

  const chosen = candidates[Math.floor(candidates.length / 2)] || candidates[0] || {
    word: article.title.split(' ')[0],
    raw: article.title.split(' ')[0],
    index: 0,
  };

  const before = words.slice(0, chosen.index).join(' ');
  const after = words.slice(chosen.index + 1).join(' ');

  const correctOption: QuestionOption = {
    id: `opt_${index}_correct`,
    text: chosen.word,
    isCorrect: true,
  };

  const distractorsWordsIt = ['secolo', 'città', 'regione', 'sviluppo', 'periodo', 'scoperta', 'sistema', 'capitale', 'cultura', 'struttura'];
  const distractorsWordsEn = ['century', 'region', 'development', 'period', 'discovery', 'system', 'capital', 'culture', 'structure', 'science'];
  const pool = isIt ? distractorsWordsIt : distractorsWordsEn;

  const otherWords = allArticles
    .filter((a) => a.pageid !== article.pageid)
    .flatMap((a) => a.title.split(' '))
    .filter((w) => w.length >= 4 && w.toLowerCase() !== chosen.word.toLowerCase());

  const distractorCandidates = Array.from(new Set([...pool, ...otherWords]))
    .filter((w) => w.toLowerCase() !== chosen.word.toLowerCase());

  const chosenDistractors = shuffleArray(distractorCandidates).slice(0, 3);
  const distractorOptions: QuestionOption[] = chosenDistractors.map((text, idx) => ({
    id: `opt_${index}_dist_${idx}`,
    text,
    isCorrect: false,
  }));

  const options = shuffleArray([correctOption, ...distractorOptions]);
  const prompt = isIt
    ? `Completa la frase mancante tratta dalla voce "${article.title}":`
    : `Complete the missing word from the article "${article.title}":`;
  const explanation = `Frase corretta: "${sentence}"`;

  return {
    id: `q_${article.pageid}_cloze`,
    type: 'cloze',
    article,
    prompt,
    clozeContext: {
      before,
      blank: chosen.word,
      after,
      fullSentence: sentence,
    },
    options,
    correctOptionId: correctOption.id,
    explanation,
    wikiQuote: sentence,
    sourceUrl: article.content_urls.desktop.page,
    categoryHint: isIt ? 'Completamento' : 'Fill in the blank',
    shouldOfferDeepening: computeShouldOfferDeepening(prompt, explanation, sentence),
  };
}

function generateTrueFalseQuestion(
  article: Article,
  allArticles: Article[],
  index: number
): Question {
  const isIt = article.lang === 'it';
  const isActuallyTrue = Math.random() >= 0.45;
  const firstSentence = article.extract.split('.')[0];

  let statement = firstSentence;
  let explanation = '';

  if (isActuallyTrue) {
    explanation = isIt
      ? `Esatto! "${article.title}" corrisponde a: ${article.extract}`
      : `Correct! "${article.title}" is indeed: ${article.extract}`;
  } else {
    const otherArticle = allArticles.find((a) => a.pageid !== article.pageid);
    if (otherArticle) {
      statement = statement.replace(article.title, otherArticle.title);
      explanation = isIt
        ? `Falso! Questa descrizione non si riferisce a "${otherArticle.title}", bensì a "${article.title}". ${article.extract}`
        : `False! This description does not describe "${otherArticle.title}", but rather "${article.title}". ${article.extract}`;
    } else {
      statement = isIt ? `${firstSentence} (non appartiene al pianeta Terra)` : `${firstSentence} (located on Mars)`;
      explanation = isIt ? `Falso! ${article.extract}` : `False! ${article.extract}`;
    }
  }

  const prompt = isIt
    ? `Vero o Falso: valuta questa affermazione su "${isActuallyTrue ? article.title : 'questo argomento'}":`
    : `True or False: evaluate this statement:`;

  const trueOptionId = `opt_${index}_true`;
  const falseOptionId = `opt_${index}_false`;

  const options: QuestionOption[] = [
    {
      id: trueOptionId,
      text: isIt ? 'Vero' : 'True',
      isCorrect: isActuallyTrue,
    },
    {
      id: falseOptionId,
      text: isIt ? 'Falso' : 'False',
      isCorrect: !isActuallyTrue,
    },
  ];

  return {
    id: `q_${article.pageid}_tf`,
    type: 'true_false',
    article,
    prompt,
    clozeContext: {
      before: statement,
      blank: '',
      after: '',
      fullSentence: statement,
    },
    options,
    correctOptionId: isActuallyTrue ? trueOptionId : falseOptionId,
    explanation,
    wikiQuote: article.extract,
    sourceUrl: article.content_urls.desktop.page,
    categoryHint: isIt ? 'Vero o Falso' : 'True or False',
    shouldOfferDeepening: computeShouldOfferDeepening(prompt, explanation, article.extract),
  };
}

/**
 * Orchestrate question generation across multiple articles or batch (used in Quick Quiz)
 */
export function generateQuizQuestions(articles: Article[]): Question[] {
  const types: QuestionType[] = ['subject_recognition', 'multiple_choice', 'cloze', 'true_false', 'multiple_choice'];
  const shuffledTypes = shuffleArray(types);

  return articles.map((article, index) => {
    const qType = shuffledTypes[index % shuffledTypes.length];
    switch (qType) {
      case 'subject_recognition':
        return generateSubjectRecognitionQuestion(article, articles, index);
      case 'cloze':
        return generateClozeQuestion(article, articles, index);
      case 'true_false':
        return generateTrueFalseQuestion(article, articles, index);
      case 'multiple_choice':
      default:
        return generateMultipleChoiceQuestion(article, articles, index);
    }
  });
}
