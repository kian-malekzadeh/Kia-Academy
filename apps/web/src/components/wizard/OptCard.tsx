'use client';

interface OptCardProps {
  icon: string;
  title: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
}

export function OptCard({ icon, title, desc, selected, onSelect }: OptCardProps) {
  return (
    <button type="button" className={`opt-card${selected ? ' selected' : ''}`} onClick={onSelect}>
      <div className="opt-icon">{icon}</div>
      <div className="opt-title">{title}</div>
      <div className="opt-desc">{desc}</div>
    </button>
  );
}
