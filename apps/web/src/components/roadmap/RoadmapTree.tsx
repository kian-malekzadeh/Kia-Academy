'use client';

import { useLanguage } from '@/context/LanguageProvider';
import { moduleMessageKey } from '@/i18n/domain';

interface RoadmapTreeProps {
  modules: string[];
}

export function RoadmapTree({ modules }: RoadmapTreeProps) {
  const { t, format } = useLanguage();

  return (
    <div className="roadmap-wrap">
      <div className="roadmap-title">{t('roadmap.tree.title')}</div>
      <div className="tree">
        {modules.map((name, i) => {
          const state = i === 0 ? 'completed' : i === 1 ? 'current' : '';
          const icon = i === 0 ? '✓' : format.number(i + 1);
          const status =
            i === 0
              ? t('roadmap.tree.completed')
              : i === 1
                ? t('roadmap.tree.upNext')
                : t('roadmap.tree.locked');
          const lineDone = i > 0 && i <= 1;

          return (
            <div key={name} className="node-wrap">
              <div className={`node-line${lineDone ? ' done' : ''}`} />
              <div className={`node-circle ${state}`}>{icon}</div>
              <div className="node-label">{t(moduleMessageKey(name))}</div>
              <div className="node-status">{status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
