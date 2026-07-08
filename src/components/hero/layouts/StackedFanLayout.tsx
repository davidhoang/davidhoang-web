import { Fragment, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { handleCardHoverLeave } from '../cardHover';
import MobileHeroSheet from '../MobileHeroSheet';
import { isMobileHeroViewport } from '../heroViewport';
import { useHeroDial } from '../HeroDialProvider';
import { cardDimensionStyle, useHeroCardTilt, useScaledFanPosition } from '../heroDialUtils';

const cardPositions = [
  { x: -400, y: 28, rotation: -9 },
  { x: -240, y: 14, rotation: -5.5 },
  { x: -80, y: 5, rotation: -2 },
  { x: 80, y: 5, rotation: 2 },
  { x: 240, y: 14, rotation: 5.5 },
  { x: 400, y: 28, rotation: 9 },
];

function cardClassName(
  card: LayoutProps['cards'][number],
  isSelected: boolean,
  isGlass: boolean,
  extra?: string
) {
  return [
    'hero-card',
    isSelected ? 'card-selected' : '',
    card.image ? 'card-with-image' : '',
    cardHasHeroLayout(card) ? 'card-has-hero-layout' : '',
    cardHasShaderSurface(card) ? 'card-has-shader' : '',
    isGlass ? 'card-glass-mode' : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

interface FanCardProps {
  card: Card;
  index: number;
  position: (typeof cardPositions)[number];
  cardCount: number;
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
}

function FanCard({
  card,
  index,
  position,
  cardCount,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  onCardClick,
  onCardHover,
}: FanCardProps) {
  const dial = useHeroDial();
  const fan = dial.stackedFan;
  const scaledPosition = useScaledFanPosition(position, dial);
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;
  const isHovered = hoveredCard === card.id;
  const prefersReducedMotion = useReducedMotion();
  const tilt = useHeroCardTilt(dial, Boolean(selectedCard));

  return (
    <motion.div
      layoutId={`hero-card-${card.id}`}
      className={cardClassName(card, false, isGlass)}
      style={{
        ...cardDimensionStyle(dial),
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: isHovered ? cardCount + 2 : cardCount - index,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 900,
      }}
      initial={{
        x: 0,
        y: 0,
        rotate: 0,
        scale: fan.entrance.initialScale,
        opacity: 1,
      }}
      animate={{
        x: isLoaded ? scaledPosition.x : 0,
        y: isLoaded ? scaledPosition.y : 0,
        rotate: isLoaded ? scaledPosition.rotation : 0,
        scale: isLoaded ? 1 : fan.entrance.initialScale,
        opacity: isOtherSelected ? fan.dimmedOpacity : 1,
      }}
      whileHover={
        selectedCard || prefersReducedMotion
          ? undefined
          : {
              x: scaledPosition.x,
              y: scaledPosition.y - fan.hover.liftY,
              rotate: scaledPosition.rotation,
              scale: fan.hover.scale,
              transition: dial.hoverTween,
            }
      }
      whileTap={selectedCard ? undefined : { scale: fan.hover.tapScale }}
      transition={{
        type: 'spring',
        stiffness: hasAnimatedIn ? fan.entrance.settleStiffness : fan.entrance.stiffness,
        damping: hasAnimatedIn ? fan.entrance.settleDamping : fan.entrance.damping,
        delay: !hasAnimatedIn && isLoaded ? index * fan.entrance.staggerDelay : 0,
        ...(hasAnimatedIn && {
          x: dial.hoverTween,
          y: dial.hoverTween,
          rotate: dial.hoverTween,
          scale: dial.hoverTween,
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
        isSelected={false}
        isGlass={isGlass}
        isHeroMediaActive={isHovered && !selectedCard}
        onLinkClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

export default function StackedFanLayout({
  cards,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  cardStyle,
  onCardClick,
  onCardDismiss,
  onCardHover,
}: LayoutProps) {
  const dial = useHeroDial();
  const fan = dial.stackedFan;
  const isGlass = cardStyle === 'glass';
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [isMobileSheet, setIsMobileSheet] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    const sync = () => setIsMobileSheet(isMobileHeroViewport());
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const expandTransition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const }
        : {
            type: 'spring' as const,
            stiffness: fan.expand.stiffness,
            damping: fan.expand.damping,
            mass: fan.expand.mass,
          },
    [prefersReducedMotion, fan.expand.stiffness, fan.expand.damping, fan.expand.mass]
  );

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      width: fan.wrapper.width,
      height: fan.wrapper.height,
      marginTop: fan.wrapper.marginTop,
    }),
    [fan.wrapper.width, fan.wrapper.height, fan.wrapper.marginTop]
  );

  return (
    <div className="cards-wrapper" style={wrapperStyle}>
      <LayoutGroup id="hero-stacked-fan">
        {cards.map((card, index) => {
          const position = cardPositions[index];
          const isSelected = selectedCard === card.id;
          const layoutId = `hero-card-${card.id}`;

          const fanCard = (
            <FanCard
              card={card}
              index={index}
              position={position}
              cardCount={cards.length}
              isGlass={isGlass}
              selectedCard={selectedCard}
              hoveredCard={hoveredCard}
              isLoaded={isLoaded}
              hasAnimatedIn={hasAnimatedIn}
              onCardClick={onCardClick}
              onCardHover={onCardHover}
            />
          );

          const desktopFullscreenCard =
            portalRoot &&
            createPortal(
              <div className="card-hero-fullscreen-stage">
                <motion.div
                  layoutId={layoutId}
                  className={cardClassName(card, true, isGlass, 'card-hero-fullscreen')}
                  style={{
                    ...cardDimensionStyle(dial),
                    backgroundColor: isGlass ? 'transparent' : card.color,
                  }}
                  transition={expandTransition}
                  onClick={() => onCardClick(card.id, card.link)}
                >
                  <CardBaseContent
                    card={card}
                    isSelected
                    isGlass={isGlass}
                    isHeroMediaActive
                    onLinkClick={(e) => e.stopPropagation()}
                  />
                </motion.div>
              </div>,
              portalRoot
            );

          const mobileSheetCard =
            portalRoot &&
            createPortal(
              <MobileHeroSheet
                card={card}
                isGlass={isGlass}
                layoutId={layoutId}
                className={cardClassName(card, true, isGlass, 'card-hero-fullscreen card-hero-fullscreen--sheet')}
                backgroundColor={isGlass ? 'transparent' : card.color}
                expandTransition={expandTransition}
                onDismiss={onCardDismiss}
              />,
              portalRoot
            );

          const expandedCard = isMobileSheet ? mobileSheetCard : desktopFullscreenCard;

          return (
            <Fragment key={card.id}>
              {!isSelected && fanCard}
              {isSelected && expandedCard}
            </Fragment>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
