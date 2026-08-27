import type { LocaleText } from '../exam/types';

/** Editable assessment (goal wizard) stage kinds. */
export type AssessmentStageKind =
  | 'single_choice'
  | 'skills_matrix'
  | 'sliders'
  | 'multi_choice'
  | 'hours';

export interface AssessmentOption {
  /** Stable value stored on AssessmentAnswers (e.g. goal `job`, interest `web`). */
  value: string;
  icon?: string;
  title: LocaleText;
  description?: LocaleText;
}

export interface AssessmentSkillTopic {
  /** Storage key used in answers.skills (e.g. `HTML/CSS`). */
  key: string;
  label: LocaleText;
}

export interface AssessmentSkillLevel {
  /** Storage value (e.g. `Never used`). */
  value: string;
  label: LocaleText;
}

export interface AssessmentSliderLabels {
  workingStyle: LocaleText;
  pace: LocaleText;
  solo: LocaleText;
  team: LocaleText;
  structured: LocaleText;
  exploratory: LocaleText;
}

export interface AssessmentHoursConfig {
  min: number;
  max: number;
  label: LocaleText;
  aria: LocaleText;
}

/** One wizard “question” / stage — ordered and editable in admin. */
export interface AssessmentQuestion {
  id: string;
  order: number;
  kind: AssessmentStageKind;
  /** Short nav label */
  stageLabel: LocaleText;
  title: LocaleText;
  description: LocaleText;
  options?: AssessmentOption[];
  /** multi_choice max selections (default 2 for interests) */
  maxSelections?: number;
  skillTopics?: AssessmentSkillTopic[];
  skillLevels?: AssessmentSkillLevel[];
  sliderLabels?: AssessmentSliderLabels;
  hours?: AssessmentHoursConfig;
}

export interface AssessmentBank {
  version: number;
  questions: AssessmentQuestion[];
}
