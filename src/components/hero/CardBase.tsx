import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { type Card, cardHasHeroLayout } from './types';
import { HeroCardShaderPattern } from './HeroCardShaderPattern';

interface CardBaseProps {
  card: Card;
  isSelected: boolean;
  isGlass: boolean;
  onLinkClick: (e: React.MouseEvent) => void;
  /** Hero image / video: play drift or video when hovered (fan) or in expanded detail. */
  isHeroMediaActive?: boolean;
}

function LinkChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function videoMimeType(src: string): string | undefined {
  const lower = src.toLowerCase();
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return undefined;
}

function CardHeroMedia({
  card,
  isHeroMediaActive,
}: {
  card: Card & { heroImage: string };
  isHeroMediaActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !card.heroVideo) return;
    if (prefersReducedMotion) {
      el.pause();
      return;
    }
    if (isHeroMediaActive) {
      void el.play().catch(() => {});
    } else {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [isHeroMediaActive, card.heroVideo, prefersReducedMotion]);

  const useVideo = Boolean(card.heroVideo);
  const idleImgSrc = card.heroImageStill ?? card.heroImage;
  const hasStillSwap = Boolean(card.heroImageStill);
  const showDrift = !useVideo && isHeroMediaActive && !prefersReducedMotion;

  return (
    <div
      className={[
        'card-hero-image-wrap',
        isHeroMediaActive ? 'card-hero-image-wrap--active' : '',
        showDrift ? 'card-hero-image-wrap--drift' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {useVideo ? (
        isHeroMediaActive ? (
          <video
            ref={videoRef}
            className="card-hero-video"
            poster={card.heroImage}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          >
            <source src={card.heroVideo} type={videoMimeType(card.heroVideo) || 'video/mp4'} />
          </video>
        ) : (
          <img
            key="hero-idle"
            className="card-hero-image"
            src={idleImgSrc}
            alt=""
            decoding="async"
          />
        )
      ) : hasStillSwap ? (
        <img
          key={isHeroMediaActive ? 'hero-active' : 'hero-idle'}
          className="card-hero-image"
          src={isHeroMediaActive ? card.heroImage : idleImgSrc}
          alt=""
          decoding="async"
        />
      ) : (
        <img className="card-hero-image" src={card.heroImage} alt="" decoding="async" />
      )}
    </div>
  );
}

/** Renders the inner content of a card: pattern/image, title, and expanded details. */
export function CardBaseContent({
  card,
  isSelected,
  isGlass,
  onLinkClick,
  isHeroMediaActive = false,
}: CardBaseProps) {
  if (cardHasHeroLayout(card)) {
    return (
      <>
        {isGlass && (
          <div className="card-glass-overlay" style={{ backgroundColor: card.color }} />
        )}
        <CardHeroMedia card={card} isHeroMediaActive={isHeroMediaActive} />
        <div className="card-unified-panel">
          <h3 className="card-title">{card.title}</h3>
          {card.subtitle && <p className="card-subtitle">{card.subtitle}</p>}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                className="card-unified-details"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              >
                <p className="card-description">{card.description}</p>
                {card.link && (
                  <div className="card-links">
                    <a
                      href={card.link}
                      className="card-link card-link--primary"
                      target={card.link.startsWith('http') ? '_blank' : undefined}
                      rel={card.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={onLinkClick}
                    >
                      {card.linkText || 'Learn more'}
                      <LinkChevron />
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
    );
  }

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
                  <LinkChevron />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
