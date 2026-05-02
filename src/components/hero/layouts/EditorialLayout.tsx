import { motion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { useMagneticTilt } from '../../useMagneticTilt';

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
  const isSelected = selectedCard === card.id;
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;
  const tilt = useMagneticTilt({ amplitude: 9, disabled: isSelected });

  return (
    <motion.div
      className={`card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${cardHasHeroLayout(card) ? 'card-has-hero-layout' : ''} ${cardHasShaderSurface(card) ? 'card-has-shader' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
      style={{
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: isSelected ? 20 : cardCount - index,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 1000,
      }}
      initial={{ x: 40, scale: 0.96, opacity: 1 }}
      animate={{
        x: isLoaded ? 0 : 40,
        opacity: isOtherSelected ? 0.3 : 1,
        scale: isSelected ? 1.02 : (isLoaded ? 1 : 0.96),
      }}
      whileHover={!isSelected ? {
        x: 8,
        transition: { type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      } : {}}
      whileTap={!isSelected ? { scale: 0.98 } : {}}
      transition={{
        type: 'spring',
        stiffness: hasAnimatedIn ? 300 : 120,
        damping: hasAnimatedIn ? 20 : 14,
        delay: !hasAnimatedIn && isLoaded ? index * 0.06 : 0,
        ...(hasAnimatedIn && {
          x: { type: 'tween' as const, duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
        }),
      }}
      onMouseEnter={() => !selectedCard && onCardHover(card.id)}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={() => {
        tilt.reset();
        onCardHover(null);
      }}
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
