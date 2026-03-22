import { motion } from 'framer-motion';
import { type LayoutProps, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';

const cardPositions = [
  { x: -400, y: 28, rotation: -9 },
  { x: -240, y: 14, rotation: -5.5 },
  { x: -80, y: 5, rotation: -2 },
  { x: 80, y: 5, rotation: 2 },
  { x: 240, y: 14, rotation: 5.5 },
  { x: 400, y: 28, rotation: 9 },
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
            className={`card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${cardHasShaderSurface(card) ? 'card-has-shader' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
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
              y: isSelected ? -52 : (isLoaded ? position.y : 50),
              rotate: isSelected ? 0 : (isLoaded ? position.rotation : 0),
              scale: isSelected ? 1.06 : (isLoaded ? 1 : 0.9),
              opacity: isOtherSelected ? 0.3 : (isLoaded ? 1 : 0),
            }}
            whileHover={!isSelected ? {
              y: position.y - 10,
              scale: 1.025,
              transition: { type: 'spring', stiffness: 280, damping: 32 }
            } : {}}
            whileTap={!isSelected ? { scale: 0.99 } : {}}
            transition={{
              type: 'spring',
              stiffness: hasAnimatedIn ? 220 : 85,
              damping: hasAnimatedIn ? 24 : 14,
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
