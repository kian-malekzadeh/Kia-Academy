interface ProgressTrackProps {
  total: number;
  current: number;
  doneClass?: string;
  segClass?: string;
}

export function ProgressTrack({
  total,
  current,
  doneClass = 'stage-seg',
  segClass,
}: ProgressTrackProps) {
  return (
    <div className={segClass ?? 'stage-track'}>
      {Array.from({ length: total }, (_, i) => {
        const cls = i < current ? 'done' : i === current ? 'current' : '';
        return <div key={i} className={`${doneClass} ${cls}`.trim()} />;
      })}
    </div>
  );
}
