import { motion } from 'framer-motion';
import type { LayoutProps } from '../types';
import { CardBaseContent } from '../CardBase';

const cardPositions = [
  { x: -400, y: 35, rotation: -15 },
  { x: -240, y: 20, rotation: -9 },
  { x: -80, y: 8, rotation: -3 },
  { x: 80, y: 8, rotation: 3 },
  { x: 240, y: 20, rotation: 9 },
  { x: 400, y: 35, rotation: 15 },
];

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

  return (
    <div className="cards-wrapper">
      {cards.map((card, index) => {
        const position = cardPositions[index];
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
            layout
            initial={{
              x: 0,
              y: 50,
              rotate: 0,
              scale: 0.9,
              opacity: 0
            }}
            animate={{
              x: isSelected ? 0 : (isLoaded ? position.x : 0),
              y: isSelected ? -70 : (isLoaded ? position.y : 50),
              rotate: isSelected ? 0 : (isLoaded ? position.rotation : 0),
              scale: isSelected ? 1.1 : (isLoaded ? 1 : 0.9),
              opacity: isOtherSelected ? 0.3 : (isLoaded ? 1 : 0),
            }}
            whileHover={!isSelected ? {
              y: position.y - 20,
              scale: 1.05,
              transition: { type: 'spring', stiffness: 400, damping: 25 }
            } : {}}
            whileTap={!isSelected ? { scale: 0.98 } : {}}
            transition={{
              type: 'spring',
              stiffness: hasAnimatedIn ? 300 : 100,
              damping: hasAnimatedIn ? 20 : 10,
              delay: !hasAnimatedIn && isLoaded ? index * 0.08 : 0,
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
