'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type DropZoneEntry = {
  el: HTMLElement;
  onDrop: (payload: string) => void;
  disabled?: boolean;
};

const dropZones = new Map<string, DropZoneEntry>();

function clearDropHighlights(className = 'dragover-touch') {
  document.querySelectorAll(`.${className}`).forEach((el) => el.classList.remove(className));
}

function highlightDropZone(x: number, y: number, className = 'dragover-touch') {
  clearDropHighlights(className);
  for (const zone of dropZones.values()) {
    if (zone.disabled) continue;
    const rect = zone.el.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      zone.el.classList.add(className);
      return;
    }
  }
}

function getDropZoneAt(x: number, y: number): DropZoneEntry | null {
  for (const zone of dropZones.values()) {
    if (zone.disabled) continue;
    const rect = zone.el.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return zone;
    }
  }
  return null;
}

export function usePointerDropZone(
  id: string,
  onDrop: (payload: string) => void,
  disabled = false,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    dropZones.set(id, {
      el,
      onDrop: (payload) => onDropRef.current(payload),
      get disabled() {
        return disabled;
      },
    });

    return () => {
      dropZones.delete(id);
    };
  }, [id, disabled]);

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragOver(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onDropEvent = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragOver(false);
      const payload = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
      if (payload) onDrop(payload);
    },
    [disabled, onDrop],
  );

  return {
    ref,
    dragOver,
    dropProps: {
      onDragOver,
      onDragLeave,
      onDrop: onDropEvent,
    },
  };
}

export function usePointerDragSource(payload: string, disabled = false) {
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || e.button !== 0) return;

      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      setDragging(true);

      const onPointerMove = (ev: PointerEvent) => {
        highlightDropZone(ev.clientX, ev.clientY);
      };

      const finish = (ev: PointerEvent) => {
        clearDropHighlights();
        const zone = getDropZoneAt(ev.clientX, ev.clientY);
        if (zone) zone.onDrop(payload);
        setDragging(false);
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          // pointer may already be released
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
    },
    [disabled, payload],
  );

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.dataTransfer.setData('text/plain', payload);
      e.dataTransfer.effectAllowed = 'move';
    },
    [disabled, payload],
  );

  return {
    dragging,
    dragProps: {
      draggable: !disabled,
      onPointerDown,
      onDragStart,
      className: `touch-draggable${dragging ? ' is-dragging' : ''}`,
      style: { touchAction: 'none' as const },
    },
  };
}

export function usePointerReorder<T extends string>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
) {
  const listRef = useRef<HTMLUListElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const getIndexAtY = useCallback((clientY: number) => {
    const list = listRef.current;
    if (!list) return null;

    const children = Array.from(list.querySelectorAll<HTMLElement>('.r-item'));
    for (let i = 0; i < children.length; i++) {
      const rect = children[i]!.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) return i;
    }
    return children.length - 1;
  }, []);

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      setItems((prev) => {
        const next = [...prev];
        const [removed] = next.splice(from, 1);
        next.splice(to, 0, removed!);
        return next;
      });
      dragIndexRef.current = to;
      setDragIndex(to);
    },
    [setItems],
  );

  const bindItem = useCallback(
    (index: number) => {
      const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        dragIndexRef.current = index;
        setDragIndex(index);

        const onPointerMove = (ev: PointerEvent) => {
          const from = dragIndexRef.current;
          if (from === null) return;
          const over = getIndexAtY(ev.clientY);
          if (over !== null) moveItem(from, over);
        };

        const finish = (ev: PointerEvent) => {
          dragIndexRef.current = null;
          setDragIndex(null);
          try {
            target.releasePointerCapture(ev.pointerId);
          } catch {
            // ignore
          }
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', finish);
          window.removeEventListener('pointercancel', finish);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', finish);
      };

      const onDragStart = () => {
        dragIndexRef.current = index;
        setDragIndex(index);
      };

      const onDragEnd = () => {
        dragIndexRef.current = null;
        setDragIndex(null);
      };

      const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const from = dragIndexRef.current;
        if (from === null || from === index) return;
        moveItem(from, index);
      };

      return {
        draggable: true,
        onPointerDown,
        onDragStart,
        onDragEnd,
        onDragOver,
        className: `r-item touch-draggable${dragIndex === index ? ' dragging' : ''}`,
        style: { touchAction: 'none' as const },
      };
    },
    [dragIndex, getIndexAtY, moveItem],
  );

  return { listRef, dragIndex, bindItem };
}
