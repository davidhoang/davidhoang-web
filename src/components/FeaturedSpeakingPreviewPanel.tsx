import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { getFeaturedSpeakingDetail } from '../data/featuredSpeakingDetails';
import {
  setFeaturedSpeakingPreview,
  subscribeFeaturedSpeakingPreview,
  getFeaturedSpeakingPreview,
} from '../stores/featuredSpeakingPreview';
import '../styles/featured-speaking-preview.css';

const HIDE_DELAY_MS = 140;
const ANCHOR_GAP_PX = 10;

export default function FeaturedSpeakingPreviewPanel() {
  const hideTimer = useRef<number | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const previewState = useSyncExternalStore(
    subscribeFeaturedSpeakingPreview,
    getFeaturedSpeakingPreview,
    () => null,
  );
  const detail = previewState ? getFeaturedSpeakingDetail(previewState.key) : undefined;
  const visible = Boolean(detail && previewState);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cancelHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  };

  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = window.setTimeout(
      () => setFeaturedSpeakingPreview(null),
      HIDE_DELAY_MS,
    );
  };

  const anchorStyle =
    visible && previewState
      ? {
          top: previewState.anchor.top + previewState.anchor.height / 2,
          left: previewState.anchor.right + ANCHOR_GAP_PX,
        }
      : undefined;

  if (!mounted) return null;

  return createPortal(
    <div
      className={`featured-speaking-preview${visible ? ' is-visible' : ''}`}
      id="featured-speaking-preview"
      role="tooltip"
      aria-live="polite"
      aria-hidden={!visible}
      style={anchorStyle}
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
      onFocus={cancelHide}
      onBlur={scheduleHide}
    >
      {detail ? (
        <article className="featured-speaking-preview__card" aria-label={detail.headline}>
          <div className="featured-speaking-preview__media">
            <img
              src={detail.image}
              alt=""
              className="featured-speaking-preview__image"
              width={52}
              height={52}
              loading="lazy"
              decoding="async"
              aria-hidden="true"
            />
          </div>
          <div className="featured-speaking-preview__body">
            <p className="featured-speaking-preview__title">{detail.headline}</p>
            <p className="featured-speaking-preview__summary">{detail.summary}</p>
            {detail.externalLabel ? (
              <p className="featured-speaking-preview__hint">
                {detail.externalLabel}
                <span aria-hidden="true"> →</span>
              </p>
            ) : null}
          </div>
        </article>
      ) : null}
    </div>,
    document.body,
  );
}
