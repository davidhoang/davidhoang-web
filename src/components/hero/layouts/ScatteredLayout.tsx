import { motion } from 'framer-motion';
import { type Card, type LayoutProps, cardHasHeroLayout, cardHasShaderSurface } from '../types';
import { CardBaseContent } from '../CardBase';
import { handleCardHoverLeave, HERO_HOVER_TWEEN } from '../cardHover';
import { useMagneticTilt } from '../../useMagneticTilt';

// Seeded random number generator (mulberry32) for deterministic placement per day
function seededRandom(seed: number) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getDateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function generatePositions(count: number) {
  const seed = getDateSeed();
  const positions: { x: number; y: number; rotation: number }[] = [];

  for (let i = 0; i < count; i++) {
    const r1 = seededRandom(seed + i * 3);
    const r2 = seededRandom(seed + i * 3 + 1);
    const r3 = seededRandom(seed + i * 3 + 2);

    // Spread cards across the viewport area: -400..400 x, -120..120 y
    const x = (r1 - 0.5) * 800;
    const y = (r2 - 0.5) * 240;
    const rotation = (r3 - 0.5) * 30; // -15 to 15 degrees

    positions.push({ x, y, rotation });
  }

  return positions;
}

interface ScatteredCardProps {
  card: Card;
  index: number;
  cardCount: number;
  position: { x: number; y: number; rotation: number };
  isGlass: boolean;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  hasAnimatedIn: boolean;
  onCardClick: LayoutProps['onCardClick'];
  onCardHover: LayoutProps['onCardHover'];
}

function ScatteredCard({
  card,
  index,
  cardCount,
  position,
  isGlass,
  selectedCard,
  hoveredCard,
  isLoaded,
  hasAnimatedIn,
  onCardClick,
  onCardHover,
}: ScatteredCardProps) {
  const isHovered = hoveredCard === card.id;
  const isSelected = selectedCard === card.id;
  const isOtherSelected = selectedCard !== null && selectedCard !== card.id;
  const tilt = useMagneticTilt({ disabled: true });

  return (
    <motion.div
      className={`hero-card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''} ${cardHasHeroLayout(card) ? 'card-has-hero-layout' : ''} ${cardHasShaderSurface(card) ? 'card-has-shader' : ''} ${isGlass ? 'card-glass-mode' : ''}`}
      style={{
        backgroundColor: isGlass ? 'transparent' : card.color,
        zIndex: isSelected ? 20 : (isHovered ? 15 : cardCount - index),
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 1000,
      }}
      initial={{
        x: 0,
        y: 0,
        rotate: 0,
        scale: 0.92,
        opacity: 1,
      }}
      animate={{
        x: isSelected ? 0 : (isLoaded ? position.x : 0),
        y: isSelected ? -40 : (isLoaded ? position.y : 0),
        rotate: isSelected ? 0 : (isLoaded ? position.rotation : 0),
        scale: isSelected ? 1.15 : (isLoaded ? 1 : 0.92),
        opacity: isOtherSelected ? 0.2 : 1,
      }}
      whileHover={!isSelected ? {
        scale: 1.06,
        rotate: 0,
        transition: HERO_HOVER_TWEEN,
      } : {}}
      whileTap={!isSelected ? { scale: 0.95 } : {}}
      transition={{
        type: 'spring',
        stiffness: hasAnimatedIn ? 200 : 80,
        damping: hasAnimatedIn ? 20 : 12,
        delay: !hasAnimatedIn && isLoaded ? index * 0.1 : 0,
        ...(hasAnimatedIn && {
          x: HERO_HOVER_TWEEN,
          y: HERO_HOVER_TWEEN,
          rotate: HERO_HOVER_TWEEN,
          scale: HERO_HOVER_TWEEN,
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

export default function ScatteredLayout({
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
  const positions = generatePositions(cards.length);

  return (
    <div className="cards-wrapper">
      {cards.map((card, index) => (
        <ScatteredCard
          key={card.id}
          card={card}
          index={index}
          cardCount={cards.length}
          position={positions[index]}
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
