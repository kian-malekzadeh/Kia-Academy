export interface ModuleScore {
  correct: number;
  total: number;
}

export interface ReadinessScores {
  [module: string]: ModuleScore;
}

export interface ReadinessTestDto {
  scores: ReadinessScores;
  userId?: string;
}

export interface ReadinessResult {
  percentages: Record<string, number>;
  average: number;
  passed: boolean;
  verdict: {
    icon: string;
    title: string;
    message: string;
    unlockTitle: string;
    unlockSub: string;
    variant: 'success' | 'warning';
  };
}

export interface ReadinessTestSummary {
  id: string;
  createdAt: string;
  average: number;
  passed: boolean;
}
