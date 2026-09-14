'use client';

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * Professional admin table primitives — sortable headers (WCAG: aria-sort),
 * status badges with redundant (color + icon + text) encoding, and table
 * toolbars shared by every admin list page.
 */

export type SortDir = 'asc' | 'desc';

export type SortState = { key: string; dir: SortDir } | null;

/**
 * Sortable table header cell.
 * - Renders a real <button> (44px+ touch target) inside the <th>.
 * - Announces the current sort via aria-sort on the <th> (WCAG).
 * - Arrows are decorative; meaning is carried by aria-sort + label.
 */
export function AdminSortHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
}) {
  const { t } = useLanguage();
  const active = sort?.key === sortKey;
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined;
  const Arrow = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  const hint = active
    ? sort.dir === 'asc'
      ? t('admin.pro.sortHintAsc')
      : t('admin.pro.sortHintDesc')
    : t('admin.pro.sortHintIdle');

  return (
    <th className="apro-sortable" aria-sort={ariaSort}>
      <button
        type="button"
        className="apro-sort"
        onClick={() => onSort(sortKey)}
        title={hint}
      >
        <span>{label}</span>
        <span className="apro-sort-arrow" aria-hidden="true">
          <Arrow size={12} />
        </span>
      </button>
    </th>
  );
}

/** Client-side sort helper for admin list pages. */
export function sortRows<T>(
  rows: T[],
  sort: SortState,
  accessors: Record<string, (row: T) => string | number>,
): T[] {
  if (!sort) return rows;
  const accessor = accessors[sort.key];
  if (!accessor) return rows;
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    return String(av).localeCompare(String(bv), 'en', { numeric: true }) * factor;
  });
}

export type ProBadgeTone = 'ok' | 'warning' | 'danger' | 'info' | 'neutral';

const BADGE_DOT: Record<ProBadgeTone, string> = {
  ok: 'ok',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: '',
};

/**
 * Semantic status badge: tone class + status dot (redundant encoding so the
 * meaning never relies on color alone) + visible text.
 */
export function AdminStatusBadge({
  tone,
  children,
}: {
  tone: ProBadgeTone;
  children: ReactNode;
}) {
  const cls = tone === 'neutral' ? 'admin-badge' : `admin-badge ${BADGE_DOT[tone]}`;
  return (
    <span className={cls}>
      <span className="apro-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Table toolbar: search field with icon + arbitrary filter controls. */
export function AdminTableToolbar({
  search,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="apro-toolbar">
      <label className="apro-search">
        <span className="sr-only">{searchLabel}</span>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          className="admin-input"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      {children}
    </div>
  );
}
