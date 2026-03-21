import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from './types';
import { HeroCardShaderPattern } from './HeroCardShaderPattern';

interface CardBaseProps {
  card: Card;
  isSelected: boolean;
  isGlass: boolean;
  onLinkClick: (e: React.MouseEvent) => void;
}

/** Renders the inner content of a card: pattern/image, title, and expanded details. */
export function CardBaseContent({ card, isSelected, isGlass, onLinkClick }: CardBaseProps) {
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
        <div className="card-pattern" style={{ backgroundColor: card.color }}>
          <HeroCardShaderPattern cardId={card.id} pattern={card.pattern} color={card.color} />
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
