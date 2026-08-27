import type { TrackKey } from '../types/roadmap';

export const TRACKS: Record<TrackKey, { name: string; modules: string[] }> = {
  web: {
    name: 'Front-End Development',
    modules: [
      'HTML/CSS Foundations',
      'JavaScript Core',
      'React Fundamentals',
      'Responsive Project Lab',
      'Portfolio & Career Prep',
    ],
  },
  ai: {
    name: 'AI & Machine Learning',
    modules: [
      'Python Foundations',
      'Data Handling with Pandas',
      'ML Fundamentals',
      'Applied Model Project',
      'Portfolio & Career Prep',
    ],
  },
  mobile: {
    name: 'Mobile Development',
    modules: [
      'Programming Foundations',
      'Swift/Kotlin Basics',
      'Mobile UI Patterns',
      'App Build Project',
      'Portfolio & Career Prep',
    ],
  },
  game: {
    name: 'Game Development',
    modules: [
      'Programming Foundations',
      'C# Basics',
      'Game Engine Essentials',
      'Playable Prototype',
      'Portfolio & Career Prep',
    ],
  },
  data: {
    name: 'Data & Analytics',
    modules: [
      'Python Foundations',
      'SQL & Databases',
      'Data Visualization',
      'Analytics Project',
      'Portfolio & Career Prep',
    ],
  },
  backend: {
    name: 'Backend & Systems',
    modules: [
      'Programming Foundations',
      'APIs & Databases',
      'Server Architecture',
      'Backend Project Lab',
      'Portfolio & Career Prep',
    ],
  },
};

/** Per-module prices in Iranian Rials (IRR), aligned with catalog pricing. */
export const MODULE_PRICES = [290_000, 320_000, 350_000, 380_000, 310_000];

/** Stable wizard stage keys — translate on the client. */
export const WIZARD_STAGES = [
  'goal',
  'skill',
  'personality',
  'interest',
  'learningStyle',
  'time',
] as const;

/** Stable readiness module keys used as score map keys. */
export const READINESS_MODULES = [
  'computerLiteracy',
  'englishReadiness',
  'algorithmicThinking',
  'flowcharts',
  'programmingFundamentals',
] as const;

export type ReadinessModuleId = (typeof READINESS_MODULES)[number];

/** Stable swap-step keys — translate on the client. */
export const SWAP_STEPS = ['step1', 'step2', 'step3', 'step4'] as const;
