import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LayoutProps } from '../types';
import { CardBaseContent } from '../CardBase';

export default function RolodexLayout({
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
  const [activeIndex, setActiveIndex] = useState(0);

  const totalCards = cards.length;
  const angleStep = 360 / totalCards;
  const radius = 320; // distance from center in 3D space

  const handleNavClick = (direction: 'prev' | 'next') => {
    setActiveIndex((prev) =>
      direction === 'next'
        ? (prev + 1) % totalCards
        : (prev - 1 + totalCards) % totalCards
    );
  };

  return (
    <div className="cards-wrapper" style={{ transformStyle: 'preserve-3d' }}>
      {cards.map((card, index) => {
        const isSelected = selectedCard === card.id;
        const isOtherSelected = selectedCard !== null && selectedCard !== card.id;

        // Calculate position in carousel
        const offset = ((index - activeIndex + totalCards) % totalCards);
        const angle = offset * angleStep;
        const angleRad = (angle * Math.PI) / 180;

        // Convert to 3D position
        const translateZ = Math.cos(angleRad) * radius;
        const translateX = Math.sin(angleRad) * radius;
        const isFront = offset === 0;
        const isAdjacent = offset === 1 || offset === totalCards - 1;

        return (
          <motion.div
            key={card.id}
            className={`card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
            style={{
              backgroundColor: isGlass ? 'transparent' : card.color,
              zIndex: isSelected ? 20 : (isFront ? 10 : (isAdjacent ? 5 : 1)),
              transformStyle: 'preserve-3d',
            }}
            initial={{
              opacity: 0,
              scale: 0.5,
              rotateY: 0,
              x: 0,
              z: 0,
            }}
            animate={{
              x: isSelected ? 0 : (isLoaded ? translateX * 0.6 : 0),
              z: isLoaded ? translateZ : 0,
              rotateY: isSelected ? 0 : (isLoaded ? -angle * 0.3 : 0),
              scale: isSelected
                ? 1.1
                : (isLoaded
                  ? (isFront ? 1 : (isAdjacent ? 0.85 : 0.7))
                  : 0.5),
              opacity: isOtherSelected
                ? 0.2
                : (isLoaded
                  ? (isFront ? 1 : (isAdjacent ? 0.7 : 0.4))
                  : 0),
              y: isSelected ? -60 : 0,
            }}
            whileHover={!isSelected && isFront ? {
              scale: 1.05,
              y: -10,
              transition: { type: 'spring', stiffness: 400, damping: 25 }
            } : {}}
            whileTap={!isSelected ? { scale: 0.98 } : {}}
            transition={{
              type: 'spring',
              stiffness: hasAnimatedIn ? 200 : 100,
              damping: hasAnimatedIn ? 25 : 15,
              delay: !hasAnimatedIn && isLoaded ? index * 0.08 : 0,
            }}
            onMouseEnter={() => !selectedCard && onCardHover(card.id)}
            onMouseLeave={() => onCardHover(null)}
            onClick={() => {
              if (isFront || isSelected) {
                onCardClick(card.id, card.link);
              } else {
                // Navigate to this card
                setActiveIndex(index);
              }
            }}
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

      {/* Navigation arrows */}
      {!selectedCard && isLoaded && (
        <>
          <button
            className="rolodex-nav rolodex-nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              handleNavClick('prev');
            }}
            aria-label="Previous card"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="rolodex-nav rolodex-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              handleNavClick('next');
            }}
            aria-label="Next card"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <style>{`
            .rolodex-nav {
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              background: var(--color-sidebar-bg, rgba(255,255,255,0.1));
              border: 1px solid var(--color-border, rgba(255,255,255,0.2));
              border-radius: 50%;
              width: 44px;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: var(--color-text);
              z-index: 15;
              transition: background 0.2s, transform 0.2s;
            }

            .rolodex-nav:hover {
              background: var(--color-link);
              color: var(--color-bg);
              transform: translateY(-50%) scale(1.1);
            }

            .rolodex-nav--prev {
              left: -60px;
            }

            .rolodex-nav--next {
              right: -60px;
            }

            @media (max-width: 768px) {
              .rolodex-nav--prev {
                left: -30px;
              }
              .rolodex-nav--next {
                right: -30px;
              }
              .rolodex-nav {
                width: 36px;
                height: 36px;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
