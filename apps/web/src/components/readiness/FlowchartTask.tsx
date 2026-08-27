'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import { usePointerDragSource, usePointerDropZone } from '@/lib/pointerDrag';

interface FlowBlock {
  id: 'start' | 'input' | 'decision' | 'even' | 'end';
  correctIndex: number;
  decision?: boolean;
}

const BLOCKS: FlowBlock[] = [
  { id: 'start', correctIndex: 0 },
  { id: 'input', correctIndex: 1 },
  { id: 'decision', correctIndex: 2, decision: true },
  { id: 'even', correctIndex: 3 },
  { id: 'end', correctIndex: 4 },
];

interface FlowchartTaskProps {
  onComplete: (correct: number, total: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function FlowchartTask({ onComplete }: FlowchartTaskProps) {
  const { t } = useLanguage();
  const shuffled = useMemo(() => shuffle(BLOCKS), []);
  const [pool, setPool] = useState<FlowBlock[]>(shuffled);
  const [slots, setSlots] = useState<(FlowBlock | null)[]>(() => Array(BLOCKS.length).fill(null));

  const labelFor = (id: FlowBlock['id']) => t(`readiness.flow.block.${id}`);

  const checkFlow = useCallback(
    (nextSlots: (FlowBlock | null)[]) => {
      let correct = 0;
      nextSlots.forEach((block, i) => {
        if (block && block.correctIndex === i) correct++;
      });
      onComplete(correct, BLOCKS.length);
    },
    [onComplete],
  );

  useEffect(() => {
    onComplete(0, BLOCKS.length);
  }, [onComplete]);

  const handleDrop = (slotIndex: number, blockId: string) => {
    if (slots[slotIndex]) return;
    const block = pool.find((b) => b.id === blockId);
    if (!block) return;

    const nextSlots = [...slots];
    nextSlots[slotIndex] = block;
    setSlots(nextSlots);
    setPool((p) => p.filter((b) => b.id !== blockId));
    checkFlow(nextSlots);
  };

  return (
    <>
      <div className="m-title">{t('readiness.flow.title')}</div>
      <div className="m-desc">{t('readiness.flow.desc')}</div>
      <div className="panel">
        <div className="flow-pool">
          {pool.map((b) => (
            <FlowBlockItem key={b.id} block={b} label={labelFor(b.id)} />
          ))}
        </div>
        <div className="flow-slots">
          {BLOCKS.map((_, i) => (
            <div key={i}>
              <FlowSlot
                slotIndex={i}
                filled={slots[i]}
                filledLabel={slots[i] ? labelFor(slots[i]!.id) : ''}
                disabled={!!slots[i]}
                onDrop={(blockId) => handleDrop(i, blockId)}
              />
              {i < BLOCKS.length - 1 && <div className="flow-arrow">↓</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function FlowBlockItem({ block, label }: { block: FlowBlock; label: string }) {
  const drag = usePointerDragSource(block.id);

  return (
    <div
      className={`flow-block${block.decision ? ' decision' : ''} ${drag.dragProps.className}`}
      draggable={drag.dragProps.draggable}
      style={drag.dragProps.style}
      onPointerDown={drag.dragProps.onPointerDown}
      onDragStart={drag.dragProps.onDragStart}
    >
      {label}
    </div>
  );
}

function FlowSlot({
  slotIndex,
  filled,
  filledLabel,
  disabled,
  onDrop,
}: {
  slotIndex: number;
  filled: FlowBlock | null;
  filledLabel: string;
  disabled: boolean;
  onDrop: (blockId: string) => void;
}) {
  const zone = usePointerDropZone(`flow-slot-${slotIndex}`, (payload) => onDrop(payload), disabled);

  return (
    <div
      ref={zone.ref}
      className={`flow-slot pointer-drop-zone${filled ? ' filled' : ''}${zone.dragOver ? ' dragover' : ''}`}
      onDragOver={zone.dropProps.onDragOver}
      onDragLeave={zone.dropProps.onDragLeave}
      onDrop={zone.dropProps.onDrop}
    >
      {filledLabel}
    </div>
  );
}
