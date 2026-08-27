import type { AssessmentAnswers, Interest } from './assessment';

export interface TrackModule {
  name: string;
  modules: string[];
}

export type TrackKey = Interest;

export interface RoadmapDto {
  assessmentId?: string;
  answers: AssessmentAnswers;
  userId?: string;
}

export interface RoadmapResponse {
  id: string;
  trackKey: TrackKey;
  trackName: string;
  modules: string[];
  level: string;
  profile: {
    goal: string;
    level: string;
    style: string;
    hours: number;
  };
  pricing: {
    individual: number[];
    total: number;
    discounted: number;
  };
  enrolled: boolean;
}
