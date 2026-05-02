import { useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { useMagneticTilt } from '../../useMagneticTilt';

/**
 * CinematicLayout — wide-screen, movie-poster feel.
 *
 * A large featured card (~75% width) with a vertical filmstrip of
 * remaining cards on the right. Click a filmstrip card to swap it
 * into the featured slot; click the featured card to open its link.
 */

function cardClassName(card: Card, extra: string, isGlass: boolean) {
  return [
    'card',
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
  hoveredCard: string | null;
  isLoaded: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
  reducedMotion: boolean;
}

function FeaturedCard({ card, isGlass, selectedCard, hoveredCard, isLoaded, onCardClick, onCardHover, reducedMotion }: FeaturedProps) {
  const isSelected = selectedCard === card.id;
  const tilt = useMagneticTilt({ amplitude: 6, disabled: isSelected || reducedMotion });

  return (
    <motion.div
      className={cardClassName(card, 'card-featured', isGlass)}
      style={{
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: 10,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 1200,
      }}
      layout={!reducedMotion}
      layoutId={`cinematic-${card.id}`}
      initial={false}
      animate={{ opacity: 1, scale: isLoaded ? 1 : 0.96 }}
      transition={{
        layout: { type: 'spring', stiffness: 220, damping: 26 },
        scale: { type: 'spring', stiffness: 180, damping: 24 },
      }}
      onMouseEnter={() => !selectedCard && onCardHover(card.id)}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={() => { tilt.reset(); onCardHover(null); }}
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

function FilmstripCard({ card, index, cardCount, isGlass, selectedCard, hoveredCard, isLoaded, hasAnimatedIn, onSwap, onCardHover, reducedMotion }: FilmstripProps) {
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;
  const tilt = useMagneticTilt({ amplitude: 3, disabled: reducedMotion });

  return (
    <motion.div
      className={cardClassName(card, 'card-filmstrip', isGlass)}
      style={{
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: cardCount - index,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 800,
      }}
      layout={!reducedMotion}
      layoutId={`cinematic-${card.id}`}
      initial={false}
      animate={{
        opacity: isOtherSelected ? 0.3 : 1,
        x: isLoaded ? 0 : 24,
        scale: isLoaded ? 1 : 0.96,
      }}
      whileHover={!reducedMotion ? {
        scale: 1.04,
        x: -4,
        transition: { type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      } : {}}
      whileTap={{ scale: 0.97 }}
      transition={{
        layout: { type: 'spring', stiffness: 220, damping: 26 },
        type: 'spring',
        stiffness: hasAnimatedIn ? 260 : 100,
        damping: hasAnimatedIn ? 22 : 14,
        delay: !hasAnimatedIn && isLoaded ? index * 0.06 : 0,
      }}
      onMouseEnter={() => !selectedCard && onCardHover(card.id)}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={() => { tilt.reset(); onCardHover(null); }}
      onClick={() => { tilt.reset(); onSwap(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSwap(); } }}
      tabIndex={0}
      role="button"
      aria-label={`Show ${card.title}`}
    >
      <CardBaseContent
        card={card}
        isSelected={false}
        isGlass={isGlass}
        isHeroMediaActive={hoveredCard === card.id}
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
            hoveredCard={hoveredCard}
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
