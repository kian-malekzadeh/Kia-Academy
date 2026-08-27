import type { AssessmentBank } from '../assessment/types';
import type { ExamQuestion } from '../exam/types';
import type { PersonalityItem } from '../personality/types';

export const TEST_BANK_IDS = ['personality', 'assessment', 'readiness'] as const;
export type TestBankId = (typeof TEST_BANK_IDS)[number];

export interface PersonalityBank {
  version: number;
  citation: string;
  items: PersonalityItem[];
}

export interface ReadinessBank {
  version: number;
  questions: ExamQuestion[];
}

export type TestBankPayload =
  | { id: 'personality'; bank: PersonalityBank }
  | { id: 'assessment'; bank: AssessmentBank }
  | { id: 'readiness'; bank: ReadinessBank };

export interface TestBankMeta {
  id: TestBankId;
  updatedAt: string | null;
  questionCount: number;
}
