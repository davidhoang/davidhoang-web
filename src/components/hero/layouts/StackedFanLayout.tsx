import { Fragment, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';

const cardPositions = [
  { x: -400, y: 28, rotation: -9 },
  { x: -240, y: 14, rotation: -5.5 },
  { x: -80, y: 5, rotation: -2 },
  { x: 80, y: 5, rotation: 2 },
  { x: 240, y: 14, rotation: 5.5 },
  { x: 400, y: 28, rotation: 9 },
];

function cardClassName(
  card: LayoutProps['cards'][number],
  isSelected: boolean,
  isGlass: boolean,
  extra?: string
) {
  return [
    'card',
    isSelected ? 'card-selected' : '',
    card.image ? 'card-with-image' : '',
    cardHasHeroLayout(card) ? 'card-has-hero-layout' : '',
    cardHasShaderSurface(card) ? 'card-has-shader' : '',
    isGlass ? 'card-glass-mode' : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

interface FanCardProps {
  card: Card;
  index: number;
  position: (typeof cardPositions)[number];
  cardCount: number;
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
}

function FanCard({
  card,
  index,
  position,
  cardCount,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  onCardClick,
  onCardHover,
}: FanCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;

  // Normalized cursor offset from card center, in [-0.5, 0.5].
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 220, damping: 22, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 220, damping: 22, mass: 0.6 });

  // Tilt away from cursor: top-of-card leans back when cursor is near top. Keep subtle (~8°).
  const tiltX = useTransform(springY, [-0.5, 0.5], [9, -9]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-9, 9]);

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || selectedCard) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      layoutId={`hero-card-${card.id}`}
      className={cardClassName(card, false, isGlass)}
      style={{
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: cardCount - index,
        rotateX: prefersReducedMotion ? 0 : tiltX,
        rotateY: prefersReducedMotion ? 0 : tiltY,
        transformPerspective: 900,
      }}
      initial={{
        x: 0,
        y: 50,
        rotate: 0,
        scale: 0.9,
        opacity: 0,
      }}
      animate={{
        x: isLoaded ? position.x : 0,
        y: isLoaded ? position.y : 50,
        rotate: isLoaded ? position.rotation : 0,
        scale: isLoaded ? 1 : 0.9,
        opacity: isOtherSelected ? 0.3 : isLoaded ? 1 : 0,
      }}
      whileHover={
        selectedCard
          ? undefined
          : {
              // Keep x/rotate explicit on hover so y/scale easing does not pull x off the fan arc.
              x: position.x,
              y: position.y - 10,
              rotate: position.rotation,
              scale: 1.025,
              transition: {
                type: 'spring',
                stiffness: 260,
                damping: 36,
                mass: 0.85,
              },
            }
      }
      whileTap={selectedCard ? undefined : { scale: 0.99 }}
      transition={{
        type: 'spring',
        stiffness: hasAnimatedIn ? 200 : 80,
        damping: hasAnimatedIn ? 28 : 16,
        delay: !hasAnimatedIn && isLoaded ? index * 0.08 : 0,
      }}
      onMouseEnter={() => !selectedCard && onCardHover(card.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        resetTilt();
        onCardHover(null);
      }}
      onClick={() => {
        resetTilt();
        onCardClick(card.id, card.link);
      }}
    >
      <CardBaseContent
        card={card}
        isSelected={false}
        isGlass={isGlass}
        isHeroMediaActive={hoveredCard === card.id && !selectedCard}
        onLinkClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

export default function StackedFanLayout({
  cards,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  cardStyle,
  onCardClick,
  onCardHover,
}: LayoutProps) {
  const isGlass = cardStyle === 'glass';
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const expandTransition = prefersReducedMotion
    ? { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const }
    : {
        type: 'spring' as const,
        stiffness: 155,
        damping: 30,
        mass: 0.88,
      };

  return (
    <div className="cards-wrapper">
      <LayoutGroup id="hero-stacked-fan">
        {cards.map((card, index) => {
          const position = cardPositions[index];
          const isSelected = selectedCard === card.id;
          const layoutId = `hero-card-${card.id}`;

          const fanCard = (
            <FanCard
              card={card}
              index={index}
              position={position}
              cardCount={cards.length}
              isGlass={isGlass}
              selectedCard={selectedCard}
              hoveredCard={hoveredCard}
              isLoaded={isLoaded}
              hasAnimatedIn={hasAnimatedIn}
              onCardClick={onCardClick}
              onCardHover={onCardHover}
            />
          );

          const fullscreenCard =
            portalRoot &&
            createPortal(
              <div className="card-hero-fullscreen-stage">
                <motion.div
                  layoutId={layoutId}
                  className={cardClassName(card, true, isGlass, 'card-hero-fullscreen')}
                  style={{
                    backgroundColor: isGlass ? 'transparent' : card.color,
                  }}
                  transition={expandTransition}
                  onClick={() => onCardClick(card.id, card.link)}
                >
                  <CardBaseContent
                    card={card}
                    isSelected
                    isGlass={isGlass}
                    isHeroMediaActive
                    onLinkClick={(e) => e.stopPropagation()}
                  />
                </motion.div>
              </div>,
              portalRoot
            );

          return (
            <Fragment key={card.id}>
              {!isSelected && fanCard}
              {isSelected && fullscreenCard}
            </Fragment>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
