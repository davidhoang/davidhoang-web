import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  color: string;
  pattern: 'lines' | 'grid' | 'waves' | 'dots' | 'circuits' | 'none';
  link?: string;
  linkText?: string;
  image?: string;
  thumbnail?: string;
}

const cards: Card[] = [
  {
    id: 'atlassian',
    title: 'Atlassian',
    subtitle: 'VP, Head of Design, AI',
    description: 'Leading design for Rovo, Atlassian\'s AI-powered knowledge assistant that connects teams, work, and applications across the SaaS ecosystem.',
    color: '#0052CC',
    pattern: 'waves',
    link: 'https://www.atlassian.com/software/rovo',
    linkText: 'Learn about Rovo'
  },
  {
    id: 'poc',
    title: 'Proof of Concept',
    subtitle: 'Newsletter',
    description: 'A weekly newsletter about design, technology, and entrepreneurship. Exploring the intersection of creativity, code, and community.',
    color: '#E85D04',
    pattern: 'lines',
    link: 'https://www.proofofconcept.pub',
    linkText: 'Subscribe'
  },
  {
    id: 'config',
    title: 'Config 2021',
    subtitle: 'Figma Conference',
    description: 'Spoke about the universal challenges of scaling design teams and building design culture.',
    color: '#2D6A4F',
    pattern: 'dots',
    link: 'https://youtu.be/piGC-iFwmrk',
    linkText: 'Watch talk'
  },
  {
    id: 'diveclub',
    title: 'Dive Club',
    subtitle: 'Podcast',
    description: 'Joined the Dive Club podcast to discuss design leadership, creative tools, and career journeys.',
    color: '#1e3a5f',
    pattern: 'waves',
    link: 'https://www.youtube.com/watch?v=6Z88rLjF-lc',
    linkText: 'Listen'
  },
  {
    id: 'odyssey',
    title: 'Career Odyssey',
    subtitle: 'Interactive Canvas',
    description: 'An explorable visualization of my 20-year journey from art school to leading design teams. A map of paths taken and not taken.',
    color: '#9D4EDD',
    pattern: 'grid',
    link: '/career-odyssey',
    linkText: 'Explore'
  },
  {
    id: 'about',
    title: 'About',
    subtitle: '',
    description: 'Designer, investor, and builder focused on tools that revolutionize the internet. Previously at Replit, Webflow, and One Medical.',
    color: '#78716c',
    pattern: 'none',
    link: '/about',
    linkText: 'Learn more',
    thumbnail: '/images/img-dh-web-light.webp'
  },
];

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
    <rect x="15" y="15" width="70" height="70" fill="none" stroke="#555" strokeWidth="1" rx="6" />
    <rect x="25" y="25" width="50" height="50" fill="none" stroke="#555" strokeWidth="1" rx="4" />
    <rect x="35" y="35" width="30" height="30" fill="none" stroke="#555" strokeWidth="1" rx="2" />
    <line x1="15" y1="50" x2="5" y2="50" stroke="#555" strokeWidth="1" />
    <line x1="85" y1="50" x2="95" y2="50" stroke="#555" strokeWidth="1" />
    <line x1="50" y1="15" x2="50" y2="5" stroke="#555" strokeWidth="1" />
    <line x1="50" y1="85" x2="50" y2="95" stroke="#555" strokeWidth="1" />
  </svg>
);

const PatternNone = () => null;

const patterns = {
  lines: PatternLines,
  grid: PatternGrid,
  waves: PatternWaves,
  dots: PatternDots,
  circuits: PatternCircuits,
  none: PatternNone,
};

// Card positions for the fanned stack - 6 cards spread out
const cardPositions = [
  { x: -400, y: 35, rotation: -15 },
  { x: -240, y: 20, rotation: -9 },
  { x: -80, y: 8, rotation: -3 },
  { x: 80, y: 8, rotation: 3 },
  { x: 240, y: 20, rotation: 9 },
  { x: 400, y: 35, rotation: 15 },
];

export default function CardStackHero() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to defer animation until component is visible
  // This improves initial page load performance by not animating off-screen content
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Skip animation entirely for users who prefer reduced motion
      setIsInView(true);
      setIsLoaded(true);
      setHasAnimatedIn(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Only need to trigger once
        }
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '50px', // Start slightly before entering viewport
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Trigger entrance animation after component is in view
  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(() => setIsLoaded(true), 100);
    // Mark animation complete after stagger finishes
    const completeTimer = setTimeout(() => setHasAnimatedIn(true), 100 + cards.length * 80 + 500);
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [isInView]);

  const handleCardClick = (cardId: string, link?: string) => {
    // About card navigates directly
    if (cardId === 'about' && link) {
      window.location.href = link;
      return;
    }
    setSelectedCard(selectedCard === cardId ? null : cardId);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCard) return;

      const currentIndex = cards.findIndex(card => card.id === selectedCard);

      if (e.key === 'Escape') {
        setSelectedCard(null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % cards.length;
        setSelectedCard(cards[nextIndex].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
        setSelectedCard(cards[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard]);

  const hasSelection = selectedCard !== null;

  return (
    <div className="card-stack-hero" ref={containerRef}>
      <div className="card-stack-container">
        <motion.h1
          className="hero-title"
          animate={{
            y: hasSelection ? -30 : 0,
            opacity: hasSelection ? 0.6 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        >
          David Hoang is a designer and investor.
        </motion.h1>
        <div className="cards-wrapper">
          {cards.map((card, index) => {
            const position = cardPositions[index];
            const isHovered = hoveredCard === card.id;
            const isSelected = selectedCard === card.id;
            const isOtherSelected = selectedCard !== null && selectedCard !== card.id;
            const Pattern = patterns[card.pattern];

            return (
              <motion.div
                key={card.id}
                className={`card ${isSelected ? 'card-selected' : ''} ${card.image ? 'card-with-image' : ''}`}
                style={{
                  backgroundColor: card.color,
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
                  y: isSelected ? -70 : (isLoaded ? (isHovered ? position.y - 15 : position.y) : 50),
                  rotate: isSelected ? 0 : (isLoaded ? position.rotation : 0),
                  scale: isSelected ? 1.1 : (isLoaded ? (isHovered ? 1.03 : 1) : 0.9),
                  opacity: isOtherSelected ? 0.3 : (isLoaded ? 1 : 0),
                }}
                transition={{
                  type: 'spring',
                  stiffness: hasAnimatedIn ? 300 : 100,
                  damping: hasAnimatedIn ? 20 : 10,
                  delay: !hasAnimatedIn && isLoaded ? index * 0.08 : 0,
                }}
                onMouseEnter={() => !selectedCard && setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(card.id, card.link)}
              >
                {card.image ? (
                  <div className="card-image" style={{ backgroundImage: `url(${card.image})` }} />
                ) : card.thumbnail ? (
                  <>
                    <div className="card-thumbnail-area">
                      <div className="card-thumbnail" style={{ backgroundImage: `url(${card.thumbnail})` }} />
                    </div>
                  </>
                ) : (
                  <div className="card-pattern">
                    <Pattern />
                  </div>
                )}

                <div className="card-content">
                  <h3 className="card-title">{card.title}</h3>
                  {card.subtitle && <p className="card-subtitle">{card.subtitle}</p>}
                </div>

                {/* Expanded content */}
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
                            onClick={(e) => e.stopPropagation()}
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
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Click outside to deselect */}
      {selectedCard && (
        <div
          className="click-outside-overlay"
          onClick={() => setSelectedCard(null)}
        />
      )}

      <style>{`
        .card-stack-hero {
          width: 100%;
          min-height: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0 1rem 0 1rem;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .card-stack-container {
          position: relative;
          width: 100%;
          max-width: 100%;
          height: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }

        .hero-title {
          font-size: clamp(2rem, 5vw, 4.5rem);
          font-weight: 700;
          margin: 0 auto 1.5rem auto;
          padding: 0 1rem;
          text-align: center;
          color: var(--color-text);
          font-family: var(--font-primary);
          line-height: 1.1;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .cards-wrapper {
          position: relative;
          width: 240px;
          height: 340px;
          margin-top: 20px;
        }

        .card {
          position: absolute;
          width: 240px;
          height: 320px;
          border-radius: 20px;
          cursor: pointer;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 0 0 1px rgba(255, 255, 255, 0.3);
          display: flex;
          flex-direction: column;
          left: 50%;
          top: 50%;
          margin-left: -120px;
          margin-top: -160px;
          transform-origin: center center;
          transition: box-shadow 0.3s ease;
          will-change: transform, opacity;
        }

        .card:hover {
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.2),
            0 8px 24px rgba(0, 0, 0, 0.12),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        }

        .card:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.5);
          outline-offset: -4px;
        }

        .card-selected {
          width: 320px;
          height: auto;
          min-height: 320px;
          margin-left: -160px;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.25), 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .card-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 55%;
          overflow: hidden;
        }

        .card-selected .card-pattern {
          height: 40%;
        }

        .card-image {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center top;
        }

        .card-thumbnail-area {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 55%;
          overflow: hidden;
        }

        .card-thumbnail {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center top;
        }

        .card-selected .card-thumbnail-area {
          height: 40%;
        }

        .card-with-image .card-content {
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
          padding-top: 60px;
        }

        .card-selected.card-with-image .card-image {
          bottom: 40%;
        }

        .card-selected.card-with-image .card-content {
          background: rgba(0,0,0,0.85);
          padding-top: 24px;
        }

        .card-content {
          margin-top: auto;
          padding: 20px;
          color: white;
          position: relative;
          z-index: 1;
        }

        .card-selected .card-content {
          padding: 24px 24px 0 24px;
        }

        .card-title {
          font-size: 1.35rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.2;
          color: white;
        }

        .card-selected .card-title {
          font-size: 1.75rem;
        }

        .card-subtitle {
          color: white;
          font-size: 0.9rem;
          margin: 6px 0 0 0;
          opacity: 0.75;
        }

        .card-selected .card-subtitle {
          font-size: 1rem;
          margin-top: 8px;
        }

        .card-expanded-content {
          padding: 16px 24px 24px 24px;
          color: white;
        }

        .card-description {
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 20px 0;
          color: white;
          opacity: 0.9;
        }

        .card-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .card-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          transition: background 0.2s;
        }

        .card-link:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .click-outside-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
        }

        /* Responsive - Fluid scaling using CSS clamp() for smoother transitions
           Scale range: 0.55 (mobile) to 1.0 (desktop)
           Formula: clamp(min, preferred, max) where preferred scales with viewport */
        .cards-wrapper {
          /* Fluid scale: 0.55 at 320px viewport, 1.0 at 1100px viewport */
          --card-scale: clamp(0.55, 0.35 + 0.045 * (100vw - 320px) / 7.8, 1);
          transform: scale(var(--card-scale));
          transform-origin: center top;
        }

        /* Large tablet breakpoint - 900px (iPad Pro, Surface) */
        @media (min-width: 769px) and (max-width: 900px) {
          .card-stack-hero {
            min-height: 420px;
          }

          .card-stack-container {
            height: 400px;
          }

          .card-selected {
            width: 300px;
            margin-left: -150px;
          }
        }

        /* Tablet breakpoint - 768px */
        @media (max-width: 768px) {
          .card-stack-hero {
            min-height: 400px;
          }

          .card-stack-container {
            height: 380px;
          }

          .cards-wrapper {
            margin-top: 15px;
          }

          .card-selected {
            width: 280px;
            margin-left: -140px;
          }

          .card-selected .card-title {
            font-size: 1.4rem;
          }
        }

        /* Mobile breakpoint - 480px */
        @media (max-width: 480px) {
          .card-stack-container {
            height: 320px;
          }

          .card-selected {
            width: 260px;
            margin-left: -130px;
          }
        }

        /* Touch device optimizations */
        @media (pointer: coarse) {
          .card {
            /* Ensure minimum tap target size */
            min-height: 44px;
          }

          .card-link {
            min-height: 44px;
            padding: 12px 20px;
          }
        }
      `}</style>
    </div>
  );
}
