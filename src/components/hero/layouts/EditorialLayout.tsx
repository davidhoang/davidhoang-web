import { motion } from 'framer-motion';
import type { LayoutProps } from '../types';
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
        const isHovered = hoveredCard === card.id;
        const isSelected = selectedCard === card.id;
        const isOtherSelected = selectedCard !== null && selectedCard !== card.id;

        return (
          <motion.div
            key={card.id}
            className={`card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
            style={{
              backgroundColor: isGlass ? 'transparent' : card.color,
              zIndex: isSelected ? 20 : cards.length - index,
            }}
            initial={{ x: 80, opacity: 0 }}
            animate={{
              x: isLoaded ? 0 : 80,
              opacity: isOtherSelected ? 0.3 : (isLoaded ? 1 : 0),
              scale: isSelected ? 1.02 : (isHovered ? 1.01 : 1),
            }}
            whileHover={!isSelected ? {
              x: 8,
              transition: { type: 'spring', stiffness: 400, damping: 25 }
            } : {}}
            whileTap={!isSelected ? { scale: 0.98 } : {}}
            transition={{
              type: 'spring',
              stiffness: hasAnimatedIn ? 300 : 120,
              damping: hasAnimatedIn ? 20 : 14,
              delay: !hasAnimatedIn && isLoaded ? index * 0.06 : 0,
            }}
            onMouseEnter={() => !selectedCard && onCardHover(card.id)}
            onMouseLeave={() => onCardHover(null)}
            onClick={() => onCardClick(card.id, card.link)}
          >
            <CardBaseContent
              card={card}
              isSelected={isSelected}
              isGlass={isGlass}
              onLinkClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
