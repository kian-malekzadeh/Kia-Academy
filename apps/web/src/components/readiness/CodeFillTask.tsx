'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

interface CodeFillTaskProps {
  onComplete: (correct: number, total: number) => void;
}

const BLANKS = {
  b1: { options: ['if', 'for', 'let'], correct: 'if' },
  b2: { options: ['>', '=', '&&'], correct: '>' },
  b3: { options: ['a', 'b', 'a + b'], correct: 'b' },
} as const;

export function CodeFillTask({ onComplete }: CodeFillTaskProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>({
    b1: '',
    b2: '',
    b3: '',
  });

  useEffect(() => {
    onComplete(0, 3);
  }, [onComplete]);

  const checkCode = (next: Record<string, string>) => {
    let correct = 0;
    (Object.keys(BLANKS) as (keyof typeof BLANKS)[]).forEach((key) => {
      if (next[key] === BLANKS[key].correct) correct++;
    });
    onComplete(correct, 3);
  };

  const handleChange = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    checkCode(next);
  };

  return (
    <>
      <div className="m-title">{t('readiness.code.title')}</div>
      <div className="m-desc">{t('readiness.code.desc')}</div>
      <div className="panel">
        <div className="code-box" dir="ltr">
          <span className="kw">function</span> <span className="fn">max</span>(a, b) {'{'}
          <br />
          &nbsp;&nbsp;
          <BlankSelect
            blankKey="b1"
            value={values.b1}
            options={BLANKS.b1.options}
            onChange={handleChange}
          />{' '}
          (a{' '}
          <BlankSelect
            blankKey="b2"
            value={values.b2}
            options={BLANKS.b2.options}
            onChange={handleChange}
          />{' '}
          b) {'{'}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="kw">return</span> a;
          <br />
          &nbsp;&nbsp;{'}'}
          <br />
          &nbsp;&nbsp;<span className="kw">return</span>{' '}
          <BlankSelect
            blankKey="b3"
            value={values.b3}
            options={BLANKS.b3.options}
            onChange={handleChange}
          />
          ;
          <br />
          {'}'}
        </div>
      </div>
    </>
  );
}

function BlankSelect({
  blankKey,
  value,
  options,
  onChange,
}: {
  blankKey: string;
  value: string;
  options: readonly string[];
  onChange: (key: string, value: string) => void;
}) {
  return (
    <select
      className="blank-select"
      dir="ltr"
      value={value}
      onChange={(e) => onChange(blankKey, e.target.value)}
    >
      <option value="">___</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
