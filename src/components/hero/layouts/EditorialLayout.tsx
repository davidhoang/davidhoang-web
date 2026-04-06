import { motion } from 'framer-motion';
import { type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';

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
      {cards.map((card, index) => {
        const isSelected = selectedCard === card.id;
        const isOtherSelected = selectedCard !== null && selectedCard !== card.id;

        return (
          <motion.div
            key={card.id}
            className={`card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${cardHasHeroLayout(card) ? 'card-has-hero-layout' : ''} ${cardHasShaderSurface(card) ? 'card-has-shader' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
            style={{
              backgroundColor: isGlass ? 'transparent' : card.color,
              zIndex: isSelected ? 20 : cards.length - index,
            }}
            initial={{ x: 80, opacity: 0 }}
            animate={{
              x: isLoaded ? 0 : 80,
              opacity: isOtherSelected ? 0.3 : (isLoaded ? 1 : 0),
              scale: isSelected ? 1.02 : 1,
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
            onMouseLeave={() => onCardHover(null)}
            onClick={() => onCardClick(card.id, card.link)}
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
      })}
    </div>
  );
}
