import { useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { handleCardHoverLeave } from '../cardHover';
import {
  applyHeroCardPhaseMotion,
  heroCardInteractionTransition,
  useHeroCardInteraction,
} from '../heroCardInteraction';
import { useHeroDial } from '../HeroDialProvider';
import { cardDimensionStyle, useHeroCardTilt } from '../heroDialUtils';

function cardClassName(card: Card, extra: string, isGlass: boolean) {
  return [
    'hero-card',
    card.image ? 'card-with-image' : '',
    cardHasHeroLayout(card) ? 'card-has-hero-layout' : '',
    cardHasShaderSurface(card) ? 'card-has-shader' : '',
    isGlass ? 'card-glass-mode' : '',
    extra,
  ].filter(Boolean).join(' ');
}

interface FeaturedProps {
  card: Card;
  isGlass: boolean;
  selectedCard: string | null;
  isLoaded: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
  reducedMotion: boolean;
}

function FeaturedCard({
  card,
  isGlass,
  selectedCard,
  isLoaded,
  onCardClick,
  onCardHover,
  reducedMotion,
}: FeaturedProps) {
  const dial = useHeroDial();
  const cinematic = dial.cinematic;
  const isSelected = selectedCard === card.id;
  const tilt = useHeroCardTilt(dial, Boolean(selectedCard));

  return (
    <motion.div
      className={cardClassName(card, 'card-featured', isGlass)}
      style={{
        ...cardDimensionStyle(dial),
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: 10,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: cinematic.featuredPerspective,
      }}
      layout={!reducedMotion}
      layoutId={`cinematic-${card.id}`}
      initial={false}
      animate={{ opacity: 1, scale: isLoaded ? 1 : cinematic.featuredInitialScale }}
      transition={{
        layout: { type: 'spring', stiffness: cinematic.layoutStiffness, damping: cinematic.layoutDamping },
        scale: { type: 'spring', stiffness: cinematic.featuredScaleStiffness, damping: cinematic.featuredScaleDamping },
      }}
      onMouseEnter={() => !selectedCard && onCardHover(card.id)}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={(e) => handleCardHoverLeave(e, onCardHover, tilt.reset)}
      onClick={() => { tilt.reset(); onCardClick(card.id, card.link); }}
      tabIndex={0}
    >
      <CardBaseContent
        card={card}
        isSelected={isSelected}
        isGlass={isGlass}
        isHeroMediaActive={true}
        onLinkClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

interface FilmstripProps {
  card: Card;
  index: number;
  cardCount: number;
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  onSwap: () => void;
  onCardHover: LayoutProps['onCardHover'];
  reducedMotion: boolean;
}

function FilmstripCard({
  card,
  index,
  cardCount,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  onSwap,
  onCardHover,
  reducedMotion,
}: FilmstripProps) {
  const dial = useHeroDial();
  const cinematic = dial.cinematic;
  const tilt = useHeroCardTilt(dial, Boolean(selectedCard));
  const { phase, isFocused, clearPress, pointerHandlers } = useHeroCardInteraction({
    cardId: card.id,
    selectedCard,
    hoveredCard,
    isLoaded,
    hoverDisabled: reducedMotion,
    onCardHover,
    onTiltReset: tilt.reset,
  });

  const restPose = {
    opacity: 1,
    x: isLoaded ? 0 : cinematic.filmstripInitialX,
    scale: isLoaded ? 1 : cinematic.filmstripInitialScale,
  };

  const animatePose = applyHeroCardPhaseMotion(phase, restPose, {
    focused: reducedMotion
      ? undefined
      : {
          scale: cinematic.filmstripHoverScale,
          x: cinematic.filmstripHoverX,
        },
    pressed: { scale: cinematic.filmstripTapScale },
    dimmed: { opacity: cinematic.dimmedOpacity },
  });

  const interactionTransition = heroCardInteractionTransition({
    hasAnimatedIn,
    phase,
    index,
    isLoaded,
    entrance: {
      stiffness: cinematic.stiffness,
      damping: cinematic.damping,
      staggerDelay: cinematic.staggerDelay,
    },
  });

  return (
    <motion.div
      className={cardClassName(card, 'card-filmstrip', isGlass)}
      style={{
        ...cardDimensionStyle(dial),
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: cardCount - index,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: cinematic.filmstripPerspective,
      }}
      layout={!reducedMotion}
      layoutId={`cinematic-${card.id}`}
      initial={false}
      animate={animatePose}
      transition={{
        layout: { type: 'spring', stiffness: cinematic.layoutStiffness, damping: cinematic.layoutDamping },
        ...interactionTransition,
      }}
      onMouseMove={tilt.onMouseMove}
      {...pointerHandlers}
      onClick={() => {
        tilt.reset();
        clearPress();
        onSwap();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSwap();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Show ${card.title}`}
    >
      <CardBaseContent
        card={card}
        isSelected={false}
        isGlass={isGlass}
        isHeroMediaActive={isFocused}
        onLinkClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

export default function CinematicLayout({
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
  const reducedMotion = useReducedMotion() ?? false;
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const featuredCard = cards[featuredIndex] || cards[0];
  const filmstripCards = cards.filter((_, i) => i !== featuredIndex);

  return (
    <LayoutGroup>
      <div className="cards-wrapper">
        <div className="cinematic-featured">
          <FeaturedCard
            card={featuredCard}
            isGlass={isGlass}
            selectedCard={selectedCard}
            isLoaded={isLoaded}
            onCardClick={onCardClick}
            onCardHover={onCardHover}
            reducedMotion={reducedMotion}
          />
        </div>
        <div className="cinematic-filmstrip" role="list" aria-label="More cards">
          {filmstripCards.map((card, i) => (
            <FilmstripCard
              key={card.id}
              card={card}
              index={i}
              cardCount={filmstripCards.length}
              isGlass={isGlass}
              selectedCard={selectedCard}
              hoveredCard={hoveredCard}
              isLoaded={isLoaded}
              hasAnimatedIn={hasAnimatedIn}
              onSwap={() => setFeaturedIndex(cards.indexOf(card))}
              onCardHover={onCardHover}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </LayoutGroup>
  );
}
