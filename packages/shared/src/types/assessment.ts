export type Goal = 'job' | 'startup' | 'freelance' | 'fun';
export type SkillLevel = 'Never used' | 'Beginner' | 'Comfortable';
/** Track / interest key — defaults are web|ai|mobile|game|data|backend; admin can add more. */
export type Interest = string;
export type LearningStyle = 'video' | 'reading' | 'building';

export interface PersonalityAnswers {
  teamwork: number;
  pace: number;
}

export interface AssessmentAnswers {
  goal: Goal | null;
  skills: Record<string, SkillLevel>;
  personality: PersonalityAnswers;
  interests: Interest[];
  style: LearningStyle | null;
  hours: number;
}

export interface AssessmentDto {
  answers: AssessmentAnswers;
  userId?: string;
}

export interface AssessmentResponse {
  id: string;
  answers: AssessmentAnswers;
  createdAt: string;
}
