/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  icon: string; // lucide icon name
  description: string;
  image?: string;
}

export interface PhotoGalleryItem {
  id: string;
  url: string;
  caption: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  cuteFeedbackCorrect: string;
  cuteFeedbackIncorrect: string;
}

export interface FutureWish {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface EnabledFeatures {
  countdown: boolean;
  timeline: boolean;
  gallery: boolean;
  reasons: boolean;
  music: boolean;
  quiz: boolean;
  letter: boolean;
  futureWishes: boolean;
  surprise: boolean;
  finalSignoff: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string; // empty means synth, or base64 audio data URL, or streaming url
  isSynth: boolean;
}

export interface ScrapbookData {
  herName: string;
  partnerName: string;
  birthdate: string; // e.g. "2026-06-15T00:00:00Z"
  welcomeMessage: string;
  welcomeImage: string;
  timeline: TimelineEvent[];
  gallery: PhotoGalleryItem[];
  reasons: string[];
  letter: {
    salutation: string;
    paragraphs: string[];
    closing: string;
  };
  futureWishes: FutureWish[];
  quiz: QuizQuestion[];
  surpriseDetails: {
    message: string;
    unlockCode?: string;
  };
  enabledFeatures?: EnabledFeatures;
  playlist?: MusicTrack[];
}

export function sanitizeScrapbookData(data: ScrapbookData): ScrapbookData {
  if (!data) return data;
  
  const sanitizeArray = <T extends { id: string }>(arr: T[] | undefined): T[] => {
    if (!arr) return [];
    const seen = new Set<string>();
    return arr.map((item, index) => {
      let id = item.id;
      if (!id || seen.has(id)) {
        id = `item-${Date.now()}-${index}-${Math.floor(Math.random() * 100000)}`;
      }
      seen.add(id);
      return { ...item, id };
    });
  };

  return {
    ...data,
    timeline: sanitizeArray(data.timeline),
    gallery: sanitizeArray(data.gallery),
    futureWishes: sanitizeArray(data.futureWishes),
    quiz: sanitizeArray(data.quiz),
    playlist: data.playlist ? sanitizeArray(data.playlist) : undefined,
  };
}
