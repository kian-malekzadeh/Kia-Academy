'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

interface LessonVideoProps {
  src?: string | null;
  title?: string;
}

export function LessonVideo({ src, title }: LessonVideoProps) {
  const { t } = useLanguage();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const wrap = wrapRef.current;
    if (!wrap || !src) return;

    try {
      if (!document.fullscreenElement) {
        await wrap.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      const video = videoRef.current as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      video?.webkitEnterFullscreen?.();
    }
  }, [src]);

  return (
    <div className="lesson-video-block" ref={wrapRef}>
      <div className="lesson-video-toolbar">
        <span className="lesson-video-label">{title || t('lesson.video')}</span>
        {src ? (
          <button
            type="button"
            className="pill-btn lesson-fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? t('lesson.exitFullscreen') : t('lesson.fullscreen')}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? t('lesson.exitFullscreen') : t('lesson.fullscreen')}</span>
          </button>
        ) : null}
      </div>
      <div className="lesson-video">
        {src ? (
          <video
            ref={videoRef}
            key={src}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            src={src}
          >
            {t('lesson.videoUnsupported')}
          </video>
        ) : (
          <div className="lesson-video-placeholder" role="status">
            <span aria-hidden="true">▶</span>
            <p>{t('lesson.videoPlaceholder')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
