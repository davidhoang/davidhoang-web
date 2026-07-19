import { motion, useReducedMotion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import {
  applyHeroCardPhaseMotion,
  heroCardInteractionTransition,
  useHeroCardInteraction,
} from '../heroCardInteraction';
import { useHeroDial } from '../HeroDialProvider';
import { cardDimensionStyle, useHeroCardTilt } from '../heroDialUtils';

interface EditorialCardProps {
  card: Card;
  index: number;
  cardCount: number;
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
}

function EditorialCard({
  card,
  index,
  cardCount,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  onCardClick,
  onCardHover,
}: EditorialCardProps) {
  const dial = useHeroDial();
  const editorial = dial.editorial;
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
    x: isLoaded ? 0 : editorial.initialX,
    scale: isLoaded ? 1 : editorial.initialScale,
    opacity: 1,
  };

  const animatePose = applyHeroCardPhaseMotion(phase, restPose, {
    focused: prefersReducedMotion ? undefined : { x: editorial.hoverX },
    pressed: { scale: editorial.tapScale },
    selected: { scale: editorial.selectedScale },
    dimmed: { opacity: editorial.dimmedOpacity },
  });

  return (
    <motion.div
      className={`hero-card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${cardHasHeroLayout(card) ? 'card-has-hero-layout' : ''} ${cardHasShaderSurface(card) ? 'card-has-shader' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
      style={{
        ...cardDimensionStyle(dial),
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: isSelected ? 20 : cardCount - index,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: editorial.perspective,
      }}
      initial={{ x: editorial.initialX, scale: editorial.initialScale, opacity: 1 }}
      animate={animatePose}
      transition={heroCardInteractionTransition({
        hasAnimatedIn,
        phase,
        index,
        isLoaded,
        entrance: {
          stiffness: editorial.stiffness,
          damping: editorial.damping,
          staggerDelay: editorial.staggerDelay,
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

export default function EditorialLayout({
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

  return (
    <div className="cards-wrapper">
      {cards.map((card, index) => (
        <EditorialCard
          key={card.id}
          card={card}
          index={index}
          cardCount={cards.length}
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
