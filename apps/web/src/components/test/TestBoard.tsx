'use client';

import { Brain, ClipboardList, Gauge } from 'lucide-react';
import type { ComponentType } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

export type TestBoardId = 'personality' | 'assessment' | 'readiness';

const TESTS: {
  id: TestBoardId;
  icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'personality', icon: Brain },
  { id: 'assessment', icon: ClipboardList },
  { id: 'readiness', icon: Gauge },
];

interface TestBoardProps {
  onStart: () => void;
  starting?: boolean;
}

/** Pre-flight board listing the three sequenced learner tests. */
export function TestBoard({ onStart, starting = false }: TestBoardProps) {
  const { t } = useLanguage();

  return (
    <section className="test-board" aria-labelledby="test-board-title">
      <header className="test-board-head">
        <p className="stage-label">{t('tests.board.eyebrow')}</p>
        <h1 id="test-board-title">{t('tests.board.title')}</h1>
        <p className="test-board-sub">{t('tests.board.sub')}</p>
      </header>

      <ol className="test-board-list">
        {TESTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={item.id} className="test-board-item">
              <span className="test-board-index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="test-board-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <div className="test-board-copy">
                <h2>{t(`tests.board.items.${item.id}.title`)}</h2>
                <p>{t(`tests.board.items.${item.id}.desc`)}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="test-board-actions">
        <button
          type="button"
          className="btn-next"
          onClick={onStart}
          disabled={starting}
        >
          {starting ? t('tests.board.starting') : t('tests.board.start')}
        </button>
        <p className="test-board-note">{t('tests.board.note')}</p>
      </div>
    </section>
  );
}
