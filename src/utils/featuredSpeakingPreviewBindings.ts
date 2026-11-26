import { getFeaturedSpeakingDetail } from '../data/featuredSpeakingDetails';
import {
  isFeaturedSpeakingPreviewEnabled,
  setFeaturedSpeakingPreview,
} from '../stores/featuredSpeakingPreview';

const HIDE_DELAY_MS = 140;
const CHRONICLE_SELECTOR = '.speaking-chronicle';

type BindingsHandle = {
  disconnect: () => void;
};

export function bindFeaturedSpeakingPreview(root: ParentNode = document): BindingsHandle | null {
  const chronicle = root.querySelector<HTMLElement>(CHRONICLE_SELECTOR);
  if (!chronicle) return null;

  let hideTimer: number | undefined;
  let trackingLink: HTMLAnchorElement | null = null;

  const cancelHide = () => {
    if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    hideTimer = undefined;
  };

  const stopTracking = () => {
    if (!trackingLink) return;
    trackingLink = null;
    window.removeEventListener('scroll', updateTrackedAnchor, true);
    window.removeEventListener('resize', updateTrackedAnchor);
  };

  const updateTrackedAnchor = () => {
    if (!trackingLink) return;
    const key = trackingLink.dataset.detailKey;
    if (!key) return;
    setFeaturedSpeakingPreview(key, trackingLink.getBoundingClientRect());
  };

  const showPreview = (link: HTMLAnchorElement) => {
    const key = link.dataset.detailKey;
    if (!key || !getFeaturedSpeakingDetail(key) || !isFeaturedSpeakingPreviewEnabled()) {
      return;
    }
    cancelHide();
    if (trackingLink !== link) {
      stopTracking();
      trackingLink = link;
      window.addEventListener('scroll', updateTrackedAnchor, true);
      window.addEventListener('resize', updateTrackedAnchor);
    }
    setFeaturedSpeakingPreview(key, link.getBoundingClientRect());
  };

  const scheduleHide = () => {
    if (!isFeaturedSpeakingPreviewEnabled()) return;
    cancelHide();
    hideTimer = window.setTimeout(() => {
      stopTracking();
      setFeaturedSpeakingPreview(null);
    }, HIDE_DELAY_MS);
  };

  const previewLinkFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    const link = target.closest<HTMLAnchorElement>('a.speaking-entry__link[data-detail-key]');
    if (!link || !chronicle.contains(link)) return null;
    return link;
  };

  const onMouseOver: EventListener = (event) => {
    const link = previewLinkFromTarget(event.target);
    if (!link) return;
    showPreview(link);
  };

  const onMouseOut: EventListener = (event) => {
    const from = previewLinkFromTarget(event.target);
    if (!from) return;
    const to = (event as MouseEvent).relatedTarget;
    if (to instanceof Node && from.contains(to)) return;
    scheduleHide();
  };

  const onFocusIn: EventListener = (event) => {
    const link = previewLinkFromTarget(event.target);
    if (link) showPreview(link);
  };

  const onFocusOut: EventListener = (event) => {
    const from = previewLinkFromTarget(event.target);
    if (!from) return;
    const to = (event as FocusEvent).relatedTarget;
    if (to instanceof Node && from.contains(to)) return;
    scheduleHide();
  };

  chronicle.addEventListener('mouseover', onMouseOver);
  chronicle.addEventListener('mouseout', onMouseOut);
  chronicle.addEventListener('focusin', onFocusIn);
  chronicle.addEventListener('focusout', onFocusOut);

  return {
    disconnect: () => {
      cancelHide();
      stopTracking();
      setFeaturedSpeakingPreview(null);
      chronicle.removeEventListener('mouseover', onMouseOver);
      chronicle.removeEventListener('mouseout', onMouseOut);
      chronicle.removeEventListener('focusin', onFocusIn);
      chronicle.removeEventListener('focusout', onFocusOut);
    },
  };
}