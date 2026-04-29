import { motion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { useMagneticTilt } from '../../useMagneticTilt';

/**
 * CinematicLayout — a wide-screen, movie-poster feel.
 *
 * The first card (or hovered card) becomes a large "featured" card
 * occupying the left ~60% of the stage. The remaining cards sit in
 * a vertical filmstrip along the right edge, small and stacked.
 *
 * Clicking a filmstrip card swaps it into the featured slot.
 */

interface CinematicCardProps {
  card: Card;
  index: number;
  cardCount: number;
  isFeatured: boolean;
  filmstripIndex: number;
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
}

function CinematicCard({
  card,
  index,
  cardCount,
  isFeatured,
  filmstripIndex,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  onCardClick,
  onCardHover,
}: CinematicCardProps) {
  const isSelected = selectedCard === card.id;
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;
  const tilt = useMagneticTilt({ amplitude: isFeatured ? 6 : 3, disabled: isSelected });

  const className = [
    'card',
    isFeatured ? 'card-featured' : 'card-filmstrip',
    isSelected ? 'card-selected' : '',
    card.image ? 'card-with-image' : '',
    cardHasHeroLayout(card) ? 'card-has-hero-layout' : '',
    cardHasShaderSurface(card) ? 'card-has-shader' : '',
    isGlass ? 'card-glass-mode' : '',
  ].filter(Boolean).join(' ');

  // Featured card: large, center-left
  if (isFeatured) {
    return (
      <motion.div
        className={className}
        style={{
          backgroundColor: isGlass ? 'transparent' : card.color,
          zIndex: 10,
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
          transformPerspective: 1200,
        }}
        layout
        layoutId={`cinematic-${card.id}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? 1 : 0.92,
        }}
        transition={{
          layout: { type: 'spring', stiffness: 250, damping: 24 },
          opacity: { duration: 0.3 },
          scale: { type: 'spring', stiffness: 250, damping: 24 },
        }}
        onMouseEnter={() => !selectedCard && onCardHover(card.id)}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={() => { tilt.reset(); onCardHover(null); }}
        onClick={() => { tilt.reset(); onCardClick(card.id, card.link); }}
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

  // Filmstrip card: small, stacked vertically on the right
  return (
    <motion.div
      className={className}
      style={{
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: cardCount - filmstripIndex,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 800,
      }}
      layout
      layoutId={`cinematic-${card.id}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{
        opacity: isOtherSelected ? 0.3 : (isLoaded ? 1 : 0),
        x: isLoaded ? 0 : 40,
        scale: isSelected ? 1.05 : 1,
      }}
      whileHover={!isSelected ? {
        scale: 1.06,
        x: -6,
        transition: { type: 'tween', duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      } : {}}
      whileTap={!isSelected ? { scale: 0.97 } : {}}
      transition={{
        layout: { type: 'spring', stiffness: 250, damping: 24 },
        type: 'spring',
        stiffness: hasAnimatedIn ? 260 : 100,
        damping: hasAnimatedIn ? 22 : 14,
        delay: !hasAnimatedIn && isLoaded ? filmstripIndex * 0.07 : 0,
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
        isHeroMediaActive={hoveredCard === card.id || isSelected}
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

  // The featured card is: hovered card > first card
  const featuredId = hoveredCard || cards[0]?.id;
  const featuredCard = cards.find(c => c.id === featuredId) || cards[0];
  const filmstripCards = cards.filter(c => c.id !== featuredCard?.id);

  return (
    <div className="cards-wrapper">
      <div className="cinematic-featured">
        {featuredCard && (
          <CinematicCard
            key={featuredCard.id}
            card={featuredCard}
            index={cards.indexOf(featuredCard)}
            cardCount={cards.length}
            isFeatured={true}
            filmstripIndex={-1}
            isGlass={isGlass}
            selectedCard={selectedCard}
            hoveredCard={hoveredCard}
            isLoaded={isLoaded}
            hasAnimatedIn={hasAnimatedIn}
            onCardClick={onCardClick}
            onCardHover={onCardHover}
          />
        )}
      </div>
      <div className="cinematic-filmstrip">
        {filmstripCards.map((card, i) => (
          <CinematicCard
            key={card.id}
            card={card}
            index={cards.indexOf(card)}
            cardCount={cards.length}
            isFeatured={false}
            filmstripIndex={i}
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
    </div>
  );
}
