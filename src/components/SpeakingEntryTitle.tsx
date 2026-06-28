import { useCallback, useEffect, useRef } from 'react';
import { getFeaturedSpeakingDetail } from '../data/featuredSpeakingDetails';
import {
  isFeaturedSpeakingPreviewEnabled,
  setFeaturedSpeakingPreview,
} from '../stores/featuredSpeakingPreview';

type Props = {
  title: string;
  href?: string;
  detailKey?: string;
};

const HIDE_DELAY_MS = 140;

export default function SpeakingEntryTitle({ title, href, detailKey }: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const trackingRef = useRef(false);
  const hasPreview = Boolean(detailKey && getFeaturedSpeakingDetail(detailKey));

  const cancelHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  const updateAnchor = useCallback(() => {
    if (!detailKey || !linkRef.current) return;
    setFeaturedSpeakingPreview(detailKey, linkRef.current.getBoundingClientRect());
  }, [detailKey]);

  const stopTracking = useCallback(() => {
    if (!trackingRef.current) return;
    trackingRef.current = false;
    window.removeEventListener('scroll', updateAnchor, true);
    window.removeEventListener('resize', updateAnchor);
  }, [updateAnchor]);

  const showPreview = useCallback(() => {
    if (!detailKey || !hasPreview || !isFeaturedSpeakingPreviewEnabled() || !linkRef.current) {
      return;
    }
    cancelHide();
    updateAnchor();
    if (!trackingRef.current) {
      trackingRef.current = true;
      window.addEventListener('scroll', updateAnchor, true);
      window.addEventListener('resize', updateAnchor);
    }
  }, [cancelHide, detailKey, hasPreview, updateAnchor]);

  const scheduleHide = useCallback(() => {
    if (!detailKey || !hasPreview || !isFeaturedSpeakingPreviewEnabled()) return;
    cancelHide();
    hideTimer.current = window.setTimeout(() => {
      stopTracking();
      setFeaturedSpeakingPreview(null);
    }, HIDE_DELAY_MS);
  }, [cancelHide, detailKey, hasPreview, stopTracking]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  if (href) {
    return (
      <a
        ref={linkRef}
        className={`speaking-entry__link${hasPreview ? ' speaking-entry__link--preview' : ''}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={showPreview}
        onMouseLeave={scheduleHide}
        onFocus={showPreview}
        onBlur={scheduleHide}
        aria-describedby={hasPreview ? 'featured-speaking-preview' : undefined}
      >
        {title}
      </a>
    );
  }

  return <>{title}</>;
}
