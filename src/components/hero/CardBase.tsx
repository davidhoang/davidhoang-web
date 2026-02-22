import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from './types';

// Pattern SVG components
const PatternLines = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.4 }}>
    {Array.from({ length: 25 }).map((_, i) => (
      <line
        key={i}
        x1={4 + i * 4}
        y1="5"
        x2={4 + i * 4}
        y2={95 - Math.random() * 40}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

const PatternGrid = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.3 }}>
    {Array.from({ length: 12 }).map((_, i) =>
      Array.from({ length: 12 }).map((_, j) => (
        <rect
          key={`${i}-${j}`}
          x={4 + i * 8}
          y={4 + j * 8}
          width="6"
          height="6"
          fill="rgba(255,255,255,0.5)"
          rx="1"
        />
      ))
    )}
  </svg>
);

const PatternWaves = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.35 }}>
    {Array.from({ length: 20 }).map((_, i) => (
      <path
        key={i}
        d={`M 0 ${5 + i * 5} Q 25 ${2 + i * 5}, 50 ${5 + i * 5} T 100 ${5 + i * 5}`}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1"
      />
    ))}
  </svg>
);

const PatternDots = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.35 }}>
    {Array.from({ length: 12 }).map((_, i) =>
      Array.from({ length: 12 }).map((_, j) => (
        <circle
          key={`${i}-${j}`}
          cx={8 + i * 8}
          cy={8 + j * 8}
          r="2"
          fill="rgba(255,255,255,0.5)"
        />
      ))
    )}
  </svg>
);

const PatternCircuits = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.4 }}>
    <rect x="15" y="15" width="70" height="70" fill="none" stroke="currentColor" strokeWidth="1" rx="6" />
    <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1" rx="4" />
    <rect x="35" y="35" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1" rx="2" />
    <line x1="15" y1="50" x2="5" y2="50" stroke="currentColor" strokeWidth="1" />
    <line x1="85" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="1" />
    <line x1="50" y1="15" x2="50" y2="5" stroke="currentColor" strokeWidth="1" />
    <line x1="50" y1="85" x2="50" y2="95" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const PatternNone = () => null;

export const patterns: Record<string, React.ComponentType> = {
  lines: PatternLines,
  grid: PatternGrid,
  waves: PatternWaves,
  dots: PatternDots,
  circuits: PatternCircuits,
  none: PatternNone,
};

interface CardBaseProps {
  card: Card;
  isSelected: boolean;
  isGlass: boolean;
  onLinkClick: (e: React.MouseEvent) => void;
}

/** Renders the inner content of a card: pattern/image, title, and expanded details. */
export function CardBaseContent({ card, isSelected, isGlass, onLinkClick }: CardBaseProps) {
  const Pattern = patterns[card.pattern] || PatternNone;

  return (
    <>
      {isGlass && (
        <div className="card-glass-overlay" style={{ backgroundColor: card.color }} />
      )}

      {card.image ? (
        <div className="card-image" style={{ backgroundImage: `url(${card.image})` }} />
      ) : card.thumbnail ? (
        <div className="card-thumbnail-area">
          <div className="card-thumbnail" style={{ backgroundImage: `url(${card.thumbnail})` }} />
        </div>
      ) : (
        <div className="card-pattern">
          <Pattern />
        </div>
      )}

      <div className="card-content">
        <h3 className="card-title">{card.title}</h3>
        {card.subtitle && <p className="card-subtitle">{card.subtitle}</p>}
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="card-expanded-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <p className="card-description">{card.description}</p>
            <div className="card-links">
              {card.link && (
                <a
                  href={card.link}
                  className="card-link"
                  target={card.link.startsWith('http') ? '_blank' : undefined}
                  rel={card.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={onLinkClick}
                >
                  {card.linkText || 'Learn more'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
