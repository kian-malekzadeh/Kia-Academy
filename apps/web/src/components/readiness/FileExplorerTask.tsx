'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import { usePointerDragSource, usePointerDropZone } from '@/lib/pointerDrag';

interface FileExplorerTaskProps {
  onComplete: (correct: number, total: number) => void;
}

const FOLDERS = [
  ['drafts', '📁', false],
  ['archive', '📁', true],
  ['trash', '🗑️', false],
] as const;

export function FileExplorerTask({ onComplete }: FileExplorerTaskProps) {
  const { t } = useLanguage();
  const [dropped, setDropped] = useState(false);
  const [droppedFolder, setDroppedFolder] = useState<string | null>(null);

  const handleDrop = (folderId: string, isCorrect: boolean) => {
    if (dropped) return;
    setDropped(true);
    setDroppedFolder(folderId);
    onComplete(isCorrect ? 1 : 0, 1);
  };

  const fileDrag = usePointerDragSource('file', dropped);

  return (
    <>
      <div className="m-title">{t('readiness.file.title')}</div>
      <div className="m-desc">{t('readiness.file.desc')}</div>
      <div className="panel">
        <div className="explorer">
          <div
            className={`file-item ${fileDrag.dragProps.className}`}
            draggable={fileDrag.dragProps.draggable}
            style={{ opacity: dropped ? 0.2 : 1, ...fileDrag.dragProps.style }}
            onPointerDown={fileDrag.dragProps.onPointerDown}
            onDragStart={fileDrag.dragProps.onDragStart}
          >
            <span className="fi-icon">📄</span>
            <span className="fi-name" dir="ltr">
              {t('readiness.file.filename')}
            </span>
          </div>
        </div>
        <div className="folder-row">
          {FOLDERS.map(([id, icon, isCorrect]) => (
            <FolderDrop
              key={id}
              id={id}
              label={t(`readiness.file.folder.${id}`)}
              icon={icon}
              showDropped={droppedFolder === id}
              disabled={dropped}
              onDrop={() => handleDrop(id, isCorrect)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function FolderDrop({
  id,
  label,
  icon,
  showDropped,
  disabled,
  onDrop,
}: {
  id: string;
  label: string;
  icon: string;
  showDropped: boolean;
  disabled: boolean;
  onDrop: () => void;
}) {
  const zone = usePointerDropZone(`folder-${id}`, () => onDrop(), disabled);

  return (
    <div
      ref={zone.ref}
      className={`folder-drop pointer-drop-zone${zone.dragOver ? ' dragover' : ''}${showDropped ? ' dropped' : ''}`}
      onDragOver={zone.dropProps.onDragOver}
      onDragLeave={zone.dropProps.onDragLeave}
      onDrop={zone.dropProps.onDrop}
    >
      <span className="fd-icon">{icon}</span>
      <b>{label}</b>
    </div>
  );
}
