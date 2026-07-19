import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import {
  applyHeroCardPhaseMotion,
  heroCardInteractionTransition,
  useHeroCardInteraction,
} from '../heroCardInteraction';
import { useHeroDial } from '../HeroDialProvider';
import { cardDimensionStyle, scaleScatteredPosition, useHeroCardTilt } from '../heroDialUtils';

function seededRandom(seed: number) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getDateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function generatePositions(count: number) {
  const seed = getDateSeed();
  const positions: { x: number; y: number; rotation: number }[] = [];

  for (let i = 0; i < count; i++) {
    const r1 = seededRandom(seed + i * 3);
    const r2 = seededRandom(seed + i * 3 + 1);
    const r3 = seededRandom(seed + i * 3 + 2);

    const x = (r1 - 0.5) * 800;
    const y = (r2 - 0.5) * 240;
    const rotation = (r3 - 0.5) * 30;

    positions.push({ x, y, rotation });
  }

  return positions;
}

interface ScatteredCardProps {
  card: Card;
  index: number;
  cardCount: number;
  position: { x: number; y: number; rotation: number };
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
}

function ScatteredCard({
  card,
  index,
  cardCount,
  position,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  onCardClick,
  onCardHover,
}: ScatteredCardProps) {
  const dial = useHeroDial();
  const scattered = dial.scattered;
  const scaledPosition = useMemo(
    () => scaleScatteredPosition(position, dial),
    [position, dial.scattered.spreadX, dial.scattered.spreadY, dial.scattered.maxRotation]
  );
  const prefersReducedMotion = useReducedMotion();
  const tilt = useHeroCardTilt(dial, Boolean(selectedCard));
  const { phase, isSelected, isFocused, clearPress, pointerHandlers } = useHeroCardInteraction({
    cardId: card.id,
    selectedCard,
    hoveredCard,
    isLoaded,
    hoverDisabled: Boolean(prefersReducedMotion),
    onCardHover,
    onTiltReset: tilt.reset,
  });

  const restPose = {
    x: isLoaded ? scaledPosition.x : 0,
    y: isLoaded ? scaledPosition.y : 0,
    rotate: isLoaded ? scaledPosition.rotation : 0,
    scale: isLoaded ? 1 : scattered.initialScale,
    opacity: 1,
  };

  const animatePose = applyHeroCardPhaseMotion(phase, restPose, {
    focused: prefersReducedMotion
      ? undefined
      : {
          scale: scattered.hoverScale,
          rotate: 0,
        },
    pressed: { scale: scattered.tapScale },
    selected: {
      x: 0,
      y: scattered.selectedLiftY,
      rotate: 0,
      scale: scattered.selectedScale,
    },
    dimmed: { opacity: scattered.dimmedOpacity },
  });

  return (
    <motion.div
      className={`hero-card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${cardHasHeroLayout(card) ? 'card-has-hero-layout' : ''} ${cardHasShaderSurface(card) ? 'card-has-shader' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
      style={{
        ...cardDimensionStyle(dial),
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: isSelected ? 20 : (isFocused ? 15 : cardCount - index),
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: scattered.perspective,
      }}
      initial={{
        x: 0,
        y: 0,
        rotate: 0,
        scale: scattered.initialScale,
        opacity: 1,
      }}
      animate={animatePose}
      transition={heroCardInteractionTransition({
        hasAnimatedIn,
        phase,
        index,
        isLoaded,
        entrance: {
          stiffness: scattered.stiffness,
          damping: scattered.damping,
          staggerDelay: scattered.staggerDelay,
        },
      })}
      onMouseMove={tilt.onMouseMove}
      {...pointerHandlers}
      onClick={() => {
        tilt.reset();
        clearPress();
        onCardClick(card.id, card.link);
      }}
    >
      <CardBaseContent
        card={card}
        isSelected={isSelected}
        isGlass={isGlass}
        isHeroMediaActive={isFocused || isSelected}
        onLinkClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

export default function ScatteredLayout({
  cards,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  cardStyle,
  onCardClick,
  onCardDismiss: _onCardDismiss,
  onCardHover,
}: LayoutProps) {
  const isGlass = cardStyle === 'glass';
  const positions = generatePositions(cards.length);

  return (
    <div className="cards-wrapper">
      {cards.map((card, index) => (
        <ScatteredCard
          key={card.id}
          card={card}
          index={index}
          cardCount={cards.length}
          position={positions[index]}
          isGlass={isGlass}
          selectedCard={selectedCard}
          hoveredCard={hoveredCard}
          isLoaded={isLoaded}
          hasAnimatedIn={hasAnimatedIn}
          onCardClick={onCardClick}
          onCardHover={onCardHover}
        />
      ))}
    </div>
  );
}
