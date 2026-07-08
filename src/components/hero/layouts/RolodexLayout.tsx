import { useState } from 'react';
import { motion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { handleCardHoverLeave } from '../cardHover';
import { useHeroDial } from '../HeroDialProvider';
import { cardDimensionStyle, useHeroCardTilt } from '../heroDialUtils';

interface RolodexCardProps {
  card: Card;
  index: number;
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  totalCards: number;
  activeIndex: number;
  angleStep: number;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
  onActivate: (index: number) => void;
}

function RolodexCard({
  card,
  index,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  totalCards,
  activeIndex,
  angleStep,
  onCardClick,
  onCardHover,
  onActivate,
}: RolodexCardProps) {
  const dial = useHeroDial();
  const rolodex = dial.rolodex;
  const isSelected = selectedCard === card.id;
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;

  const offset = (index - activeIndex + totalCards) % totalCards;
  const angle = offset * angleStep;
  const angleRad = (angle * Math.PI) / 180;
  const translateZ = Math.cos(angleRad) * rolodex.radius;
  const translateX = Math.sin(angleRad) * rolodex.radius;
  const isFront = offset === 0;
  const isAdjacent = offset === 1 || offset === totalCards - 1;

  const tilt = useHeroCardTilt(dial, Boolean(selectedCard));

  return (
    <motion.div
      className={`hero-card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${cardHasHeroLayout(card) ? 'card-has-hero-layout' : ''} ${cardHasShaderSurface(card) ? 'card-has-shader' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
      style={{
        ...cardDimensionStyle(dial),
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: isSelected ? 20 : (isFront ? 10 : (isAdjacent ? 5 : 1)),
        transformStyle: 'preserve-3d',
        rotateX: tilt.rotateX,
      }}
      initial={{
        opacity: 1,
        scale: rolodex.initialScale,
        rotateY: 0,
        x: 0,
        z: 0,
      }}
      animate={{
        x: isSelected ? 0 : (isLoaded ? translateX * rolodex.translateXFactor : 0),
        z: isLoaded ? translateZ : 0,
        rotateY: isSelected ? 0 : (isLoaded ? -angle * rolodex.rotateYFactor : 0),
        scale: isSelected
          ? rolodex.selectedScale
          : (isLoaded
            ? (isFront ? rolodex.frontScale : (isAdjacent ? rolodex.adjacentScale : rolodex.backScale))
            : rolodex.initialScale),
        opacity: isOtherSelected
          ? rolodex.dimmedOpacity
          : (isLoaded
            ? (isFront ? rolodex.frontOpacity : (isAdjacent ? rolodex.adjacentOpacity : rolodex.backOpacity))
            : 1),
        y: isSelected ? rolodex.selectedLiftY : 0,
      }}
      whileHover={!isSelected && isFront ? {
        scale: rolodex.hoverScale,
        y: rolodex.hoverLiftY,
        transition: dial.hoverTween,
      } : {}}
      whileTap={!isSelected ? { scale: rolodex.tapScale } : {}}
      transition={{
        type: 'spring',
        stiffness: hasAnimatedIn ? rolodex.settleStiffness : rolodex.stiffness,
        damping: hasAnimatedIn ? rolodex.settleDamping : rolodex.damping,
        delay: !hasAnimatedIn && isLoaded ? index * rolodex.staggerDelay : 0,
        ...(hasAnimatedIn && {
          x: dial.hoverTween,
          y: dial.hoverTween,
          rotateY: dial.hoverTween,
          scale: dial.hoverTween,
        }),
      }}
      onMouseEnter={() => !selectedCard && onCardHover(card.id)}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={(e) => handleCardHoverLeave(e, onCardHover, tilt.reset)}
      onClick={() => {
        tilt.reset();
        if (isFront || isSelected) {
          onCardClick(card.id, card.link);
        } else {
          onActivate(index);
        }
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

export default function RolodexLayout({
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
  const [activeIndex, setActiveIndex] = useState(0);

  const totalCards = cards.length;
  const angleStep = 360 / totalCards;

  const handleNavClick = (direction: 'prev' | 'next') => {
    setActiveIndex((prev) =>
      direction === 'next'
        ? (prev + 1) % totalCards
        : (prev - 1 + totalCards) % totalCards
    );
  };

  return (
    <div className="cards-wrapper" style={{ transformStyle: 'preserve-3d' }}>
      {cards.map((card, index) => (
        <RolodexCard
          key={card.id}
          card={card}
          index={index}
          isGlass={isGlass}
          selectedCard={selectedCard}
          hoveredCard={hoveredCard}
          isLoaded={isLoaded}
          hasAnimatedIn={hasAnimatedIn}
          totalCards={totalCards}
          activeIndex={activeIndex}
          angleStep={angleStep}
          onCardClick={onCardClick}
          onCardHover={onCardHover}
          onActivate={setActiveIndex}
        />
      ))}

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
              transition: background var(--duration-normal), transform var(--duration-normal);
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
