'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

interface EnglishReadinessTaskProps {
  onComplete: (correct: number, total: number) => void;
  /** Called on the final question to advance to the next readiness module. */
  onAdvanceToNextModule?: () => void;
}

const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;
const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const;
const CORRECT_INDEX = [0, 1, 0, 1, 1] as const;

export function EnglishReadinessTask({
  onComplete,
  onAdvanceToNextModule,
}: EnglishReadinessTaskProps) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(QUESTION_KEYS.length).fill(null),
  );

  const isLastQuestion = current === QUESTION_KEYS.length - 1;

  const questions = useMemo(
    () =>
      QUESTION_KEYS.map((key, qi) => ({
        prompt: t(`readiness.english.${key}.prompt`),
        options: OPTION_KEYS.map((opt) => t(`readiness.english.${key}.${opt}`)),
        correct: CORRECT_INDEX[qi]!,
      })),
    [t],
  );

  const reportScore = useCallback(
    (nextAnswers: (number | null)[]) => {
      let correct = 0;
      nextAnswers.forEach((ans, i) => {
        if (ans === CORRECT_INDEX[i]) correct++;
      });
      onComplete(correct, QUESTION_KEYS.length);
    },
    [onComplete],
  );

  useEffect(() => {
    reportScore(answers);
  }, [answers, reportScore]);

  const pickOption = (optionIndex: number) => {
    setSelected(optionIndex);
    const next = [...answers];
    next[current] = optionIndex;
    setAnswers(next);
  };

  const goNext = () => {
    if (current < QUESTION_KEYS.length - 1) {
      setCurrent(current + 1);
      setSelected(answers[current + 1] ?? null);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setSelected(answers[current - 1] ?? null);
    }
  };

  const advanceModule = () => {
    if (selected === null) return;
    onAdvanceToNextModule?.();
  };

  const q = questions[current]!;

  return (
    <>
      <div className="m-title">{t('readiness.english.title')}</div>
      <div className="m-desc">{t('readiness.english.desc')}</div>
      <div className="panel">
        <div className="mcq-progress">
          {t('readiness.english.progress', {
            current: current + 1,
            total: QUESTION_KEYS.length,
          })}
        </div>
        <p className="mcq-prompt">{q.prompt}</p>
        <div className="mcq-options">
          {q.options.map((option, i) => (
            <button
              key={`${QUESTION_KEYS[current]}-${OPTION_KEYS[i]}`}
              type="button"
              className={`mcq-option${selected === i ? ' selected' : ''}`}
              onClick={() => pickOption(i)}
            >
              <span className="mcq-letter">{String.fromCharCode(65 + i)}</span>
              {option}
            </button>
          ))}
        </div>
        <div className="mcq-nav">
          {isLastQuestion ? (
            <button
              type="button"
              className="btn-next mcq-nav-advance"
              onClick={advanceModule}
              disabled={selected === null}
            >
              {t('readiness.english.nextStage')}
            </button>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={goPrev} disabled={current === 0}>
                {t('readiness.english.previous')}
              </button>
              <button
                type="button"
                className="btn-next"
                onClick={goNext}
                disabled={selected === null}
              >
                {t('readiness.english.next')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
