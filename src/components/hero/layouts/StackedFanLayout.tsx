import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import {
  applyHeroCardPhaseMotion,
  heroCardInteractionTransition,
  useHeroCardInteraction,
} from '../heroCardInteraction';
import { isMobileHeroViewport } from '../heroViewport';
import {
  mobileStackOffsetFromActive,
  mobileStackZIndex,
  readMobileHeroCardDimensions,
  type MobileHeroCardDimensions,
} from '../mobileHeroStack';
import { useHeroDial } from '../HeroDialProvider';
import { cardDimensionStyle, useHeroCardTilt, useScaledFanPosition } from '../heroDialUtils';

const cardPositions = [
  { x: -400, y: 28, rotation: -9 },
  { x: -240, y: 14, rotation: -5.5 },
  { x: -80, y: 5, rotation: -2 },
  { x: 80, y: 5, rotation: 2 },
  { x: 240, y: 14, rotation: 5.5 },
  { x: 400, y: 28, rotation: 9 },
];

const SWIPE_THRESHOLD_PX = 48;

function cardClassName(card: LayoutProps['cards'][number], isGlass: boolean) {
  return [
    'hero-card',
    card.image ? 'card-with-image' : '',
    cardHasHeroLayout(card) ? 'card-has-hero-layout' : '',
    cardHasShaderSurface(card) ? 'card-has-shader' : '',
    isGlass ? 'card-glass-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function mobileCardDimensionStyle(dims: MobileHeroCardDimensions, borderRadius: number): CSSProperties {
  return {
    width: dims.width,
    height: dims.height,
    borderRadius,
    marginLeft: -dims.width / 2,
    marginTop: -dims.height / 2,
    ['--card-radius' as string]: `${borderRadius}px`,
    ['--card-hero-inner-radius' as string]: `calc(${borderRadius}px - var(--card-hero-frame))`,
    ['--card-panel-inner-radius' as string]: `max(0px, calc(${borderRadius}px - var(--card-panel-inset)))`,
  };
}

interface FanCardProps {
  card: Card;
  index: number;
  position: (typeof cardPositions)[number];
  cardCount: number;
  isGlass: boolean;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  isMobileStack: boolean;
  activeIndex: number;
  mobileDims: MobileHeroCardDimensions | null;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
  onActivate: (index: number) => void;
}

function FanCard({
  card,
  index,
  position,
  cardCount,
  isGlass,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  isMobileStack,
  activeIndex,
  mobileDims,
  onCardClick,
  onCardHover,
  onActivate,
}: FanCardProps) {
  const dial = useHeroDial();
  const fan = dial.stackedFan;
  const scaledPosition = useScaledFanPosition(position, dial);
  const mobileStack = useMemo(
    () => mobileStackOffsetFromActive(index, activeIndex, cardCount),
    [index, activeIndex, cardCount]
  );
  const layoutPosition = isMobileStack ? mobileStack.position : scaledPosition;
  const stackScale = isMobileStack ? mobileStack.position.scale : 1;
  const isFront = isMobileStack ? mobileStack.offset === 0 : true;
  const prefersReducedMotion = useReducedMotion();
  const tilt = useHeroCardTilt(dial, isMobileStack);
  const hoverDisabled = Boolean(prefersReducedMotion) || isMobileStack;

  const { phase, isFocused, clearPress, pointerHandlers } = useHeroCardInteraction({
    cardId: card.id,
    selectedCard: null,
    hoveredCard,
    isLoaded,
    hoverDisabled,
    onCardHover,
    onTiltReset: tilt.reset,
  });

  const dimensionStyle = useMemo(() => {
    if (isMobileStack && mobileDims) {
      return mobileCardDimensionStyle(mobileDims, dial.card.borderRadius);
    }
    return cardDimensionStyle(dial);
  }, [isMobileStack, mobileDims, dial]);

  const restPose = {
    x: isLoaded ? layoutPosition.x : 0,
    y: isLoaded ? layoutPosition.y : 0,
    rotate: isLoaded ? layoutPosition.rotation : 0,
    scale: isLoaded ? stackScale : fan.entrance.initialScale,
    opacity: 1,
  };

  const animatePose = applyHeroCardPhaseMotion(phase, restPose, {
    // Omit focus lift when hover is disabled so press-on-touch only scales from rest.
    focused: hoverDisabled
      ? undefined
      : {
          y: scaledPosition.y - fan.hover.liftY,
          scale: fan.hover.scale,
        },
    pressed: {
      scale: isMobileStack ? stackScale * 0.99 : fan.hover.tapScale,
    },
    dimmed: {
      opacity: fan.dimmedOpacity,
    },
  });

  // Stable fan order; hover only boosts stacking. Demote after the leave spring so
  // the stack doesn’t pop when z-index flips mid-motion.
  const baseZ = isMobileStack
    ? mobileStackZIndex(mobileStack.offset, cardCount, false)
    : cardCount - index;
  const elevatedZ = isMobileStack
    ? mobileStackZIndex(mobileStack.offset, cardCount, true)
    : cardCount + 2;
  const stackZ = isFocused ? elevatedZ : baseZ;

  const interactionTransition = heroCardInteractionTransition({
    hasAnimatedIn,
    phase,
    index,
    isLoaded,
    entrance: {
      stiffness: fan.entrance.stiffness,
      damping: fan.entrance.damping,
      staggerDelay: fan.entrance.staggerDelay,
    },
  });

  return (
    <motion.div
      className={cardClassName(card, isGlass)}
      role="link"
      tabIndex={0}
      aria-label={card.linkText ? `${card.title} — ${card.linkText}` : card.title}
      style={{
        ...dimensionStyle,
        backgroundColor: isGlass ? 'transparent' : card.color,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 900,
      }}
      initial={{
        x: 0,
        y: 0,
        rotate: 0,
        scale: fan.entrance.initialScale,
        opacity: 1,
        zIndex: baseZ,
      }}
      animate={{
        ...animatePose,
        zIndex: stackZ,
      }}
      transition={{
        ...interactionTransition,
        zIndex: {
          type: 'tween',
          duration: 0,
          delay: isFocused ? 0 : 0.28,
        },
      }}
      onMouseMove={tilt.onMouseMove}
      {...pointerHandlers}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        if (isMobileStack && !isFront) {
          onActivate(index);
          return;
        }
        onCardClick(card.id, card.link);
      }}
      onClick={() => {
        tilt.reset();
        clearPress();
        if (isMobileStack && !isFront) {
          onActivate(index);
          return;
        }
        onCardClick(card.id, card.link);
      }}
    >
      <CardBaseContent
        card={card}
        isSelected={false}
        isGlass={isGlass}
        isHeroMediaActive={isFocused || (isMobileStack && isFront)}
        onLinkClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

export default function StackedFanLayout({
  cards,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  cardStyle,
  onCardClick,
  onCardHover,
}: LayoutProps) {
  const dial = useHeroDial();
  const fan = dial.stackedFan;
  const isGlass = cardStyle === 'glass';
  const [isMobileStack, setIsMobileStack] = useState(false);
  const [mobileDims, setMobileDims] = useState<MobileHeroCardDimensions | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(cards.length / 2));
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const syncMobileStack = useCallback(() => {
    const mobile = isMobileHeroViewport();
    setIsMobileStack(mobile);
    setMobileDims(mobile ? readMobileHeroCardDimensions(window.innerWidth) : null);
  }, []);

  useLayoutEffect(() => {
    syncMobileStack();
    window.addEventListener('resize', syncMobileStack);
    return () => window.removeEventListener('resize', syncMobileStack);
  }, [syncMobileStack]);

  useEffect(() => {
    if (!isMobileStack) return;
    document.documentElement.setAttribute('data-hero-mobile-stack', 'true');
    return () => document.documentElement.removeAttribute('data-hero-mobile-stack');
  }, [isMobileStack]);

  const wrapperStyle = useMemo<CSSProperties>(() => {
    if (isMobileStack && mobileDims) {
      return {
        width: mobileDims.wrapperWidth,
        height: mobileDims.wrapperHeight,
        marginTop: 0,
      };
    }
    return {
      width: fan.wrapper.width,
      height: fan.wrapper.height,
      marginTop: fan.wrapper.marginTop,
    };
  }, [isMobileStack, mobileDims, fan.wrapper.width, fan.wrapper.height, fan.wrapper.marginTop]);

  const cycleActive = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((prev) => (prev + direction + cards.length) % cards.length);
      onCardHover(null);
    },
    [cards.length, onCardHover]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isMobileStack) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [isMobileStack]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isMobileStack || !touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
      cycleActive(dx < 0 ? 1 : -1);
    },
    [isMobileStack, cycleActive]
  );

  return (
    <div
      className={`cards-wrapper${isMobileStack ? ' cards-wrapper--mobile-stack' : ''}`}
      style={wrapperStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {cards.map((card, index) => (
        <FanCard
          key={card.id}
          card={card}
          index={index}
          position={cardPositions[index]}
          cardCount={cards.length}
          isGlass={isGlass}
          hoveredCard={hoveredCard}
          isLoaded={isLoaded}
          hasAnimatedIn={hasAnimatedIn}
          isMobileStack={isMobileStack}
          activeIndex={activeIndex}
          mobileDims={mobileDims}
          onCardClick={onCardClick}
          onCardHover={onCardHover}
          onActivate={setActiveIndex}
        />
      ))}
    </div>
  );
}
