import { useEffect, useRef } from 'react';
import {
  motion,
  useAnimation,
  useDragControls,
  useReducedMotion,
  type PanInfo,
  type Transition,
} from 'framer-motion';
import { CardBaseContent } from './CardBase';
import type { Card } from './types';

const DISMISS_Y_OFFSET = 72;
const DISMISS_Y_VELOCITY = 420;
const DISMISS_X_OFFSET = 96;
const DISMISS_X_VELOCITY = 420;

interface MobileHeroSheetProps {
  card: Card;
  isGlass: boolean;
  layoutId: string;
  className: string;
  backgroundColor: string | undefined;
  expandTransition: Transition;
  onDismiss: () => void;
}

function shouldDismissDrag(info: PanInfo): 'down' | 'side' | null {
  const dismissDown = info.offset.y > DISMISS_Y_OFFSET || info.velocity.y > DISMISS_Y_VELOCITY;
  if (dismissDown && info.offset.y >= 0) return 'down';

  const dismissSide =
    Math.abs(info.offset.x) > DISMISS_X_OFFSET || Math.abs(info.velocity.x) > DISMISS_X_VELOCITY;
  if (dismissSide && Math.abs(info.offset.x) > Math.abs(info.offset.y) * 0.55) return 'side';

  return null;
}

export default function MobileHeroSheet({
  card,
  isGlass,
  layoutId,
  className,
  backgroundColor,
  expandTransition,
  onDismiss,
}: MobileHeroSheetProps) {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.setAttribute('data-hero-sheet-open', 'true');
    return () => {
      document.documentElement.removeAttribute('data-hero-sheet-open');
      document.documentElement.style.removeProperty('--hero-sheet-drag-progress');
    };
  }, []);

  const setDragProgress = (offsetY: number) => {
    if (offsetY <= 0) {
      document.documentElement.style.removeProperty('--hero-sheet-drag-progress');
      return;
    }
    const progress = Math.min(1, offsetY / (window.innerHeight * 0.35));
    document.documentElement.style.setProperty('--hero-sheet-drag-progress', progress.toFixed(3));
  };

  const handleDrag = (_event: PointerEvent, info: PanInfo) => {
    setDragProgress(Math.max(0, info.offset.y));
  };

  const handleDragEnd = async (_event: PointerEvent, info: PanInfo) => {
    const dismiss = shouldDismissDrag(info);

    if (dismiss === 'down') {
      await controls.start({
        y: window.innerHeight,
        transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
      });
      onDismiss();
      return;
    }

    if (dismiss === 'side') {
      const direction = info.offset.x >= 0 ? 1 : -1;
      await controls.start({
        x: direction * window.innerWidth,
        opacity: 0,
        transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] },
      });
      onDismiss();
      return;
    }

    await controls.start({
      x: 0,
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 420, damping: 36 },
    });
    setDragProgress(0);
  };

  const startDragFromHandle = (event: React.PointerEvent) => {
    dragControls.start(event);
  };

  const startDragFromBody = (event: React.PointerEvent) => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;
    dragControls.start(event);
  };

  return (
    <div className="card-hero-fullscreen-stage card-hero-fullscreen-stage--sheet">
      <motion.div
        layoutId={layoutId}
        className={className}
        style={{ backgroundColor }}
        transition={expandTransition}
        drag={prefersReducedMotion ? false : true}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.72, left: 0.55, right: 0.55 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        role="dialog"
        aria-modal="true"
        aria-label={`${card.title} details`}
        tabIndex={-1}
      >
        <div
          className="card-sheet-grabber"
          aria-hidden="true"
          onPointerDown={startDragFromHandle}
        />
        <div
          ref={scrollRef}
          className="card-sheet-scroll"
          onPointerDown={startDragFromBody}
        >
          <CardBaseContent
            card={card}
            isSelected
            isGlass={isGlass}
            isHeroMediaActive
            onLinkClick={(e) => e.stopPropagation()}
          />
        </div>
      </motion.div>
    </div>
  );
}
