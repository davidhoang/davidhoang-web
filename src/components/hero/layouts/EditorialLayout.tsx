import { motion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { handleCardHoverLeave } from '../cardHover';
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
  const isSelected = selectedCard === card.id;
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;
  const tilt = useHeroCardTilt(dial, Boolean(selectedCard));

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
      animate={{
        x: isLoaded ? 0 : editorial.initialX,
        opacity: isOtherSelected ? editorial.dimmedOpacity : 1,
        scale: isSelected ? editorial.selectedScale : (isLoaded ? 1 : editorial.initialScale),
      }}
      whileHover={!isSelected ? {
        x: editorial.hoverX,
        transition: dial.hoverTween,
      } : {}}
      whileTap={!isSelected ? { scale: editorial.tapScale } : {}}
      transition={{
        type: 'spring',
        stiffness: hasAnimatedIn ? editorial.settleStiffness : editorial.stiffness,
        damping: hasAnimatedIn ? editorial.settleDamping : editorial.damping,
        delay: !hasAnimatedIn && isLoaded ? index * editorial.staggerDelay : 0,
        ...(hasAnimatedIn && {
          x: dial.hoverTween,
        }),
      }}
      onMouseEnter={() => !selectedCard && onCardHover(card.id)}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={(e) => handleCardHoverLeave(e, onCardHover, tilt.reset)}
      onClick={() => {
        tilt.reset();
        onCardClick(card.id, card.link);
      }}
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
