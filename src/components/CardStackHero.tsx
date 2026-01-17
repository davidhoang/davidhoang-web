import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  color: string;
  pattern: 'lines' | 'grid' | 'waves' | 'dots' | 'circuits';
  link?: string;
  linkText?: string;
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
    id: 'investing',
    title: 'Angel Investing',
    subtitle: '30+ companies',
    description: 'Investing in early-stage startups at the intersection of creativity, code, and community. Focused on tools that empower creators and builders.',
    color: '#2D6A4F',
    pattern: 'dots',
  },
  {
    id: 'play',
    title: 'Play',
    subtitle: 'Advisor',
    description: 'Contributing strategic guidance to help shape the future of mobile design tools and creative expression.',
    color: '#9D4EDD',
    pattern: 'grid',
    link: 'https://createwithplay.com',
    linkText: 'Visit Play'
  },
  {
    id: 'odyssey',
    title: 'Career Odyssey',
    subtitle: 'Interactive Canvas',
    description: 'An explorable visualization of my 20-year journey from art school to leading design teams. A map of paths taken and not taken.',
    color: '#1a1a1a',
    pattern: 'circuits',
    link: '/career-odyssey',
    linkText: 'Explore'
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

const patterns = {
  lines: PatternLines,
  grid: PatternGrid,
  waves: PatternWaves,
  dots: PatternDots,
  circuits: PatternCircuits,
};

// Card positions for the fanned stack - more spread out
const cardPositions = [
  { x: -280, y: 30, rotation: -12 },
  { x: -140, y: 15, rotation: -6 },
  { x: 0, y: 0, rotation: 0 },
  { x: 140, y: 15, rotation: 6 },
  { x: 280, y: 30, rotation: 12 },
];

export default function CardStackHero() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (cardId: string) => {
    setSelectedCard(selectedCard === cardId ? null : cardId);
  };

  return (
    <div className="card-stack-hero" ref={containerRef}>
      <div className="card-stack-container">
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
                className={`card ${isSelected ? 'card-selected' : ''}`}
                style={{
                  backgroundColor: card.color,
                  zIndex: isSelected ? 20 : isHovered ? 15 : 5 - index,
                }}
                layout
                animate={{
                  x: isSelected ? 0 : position.x,
                  y: isSelected ? 0 : (isHovered ? position.y - 15 : position.y),
                  rotate: isSelected ? 0 : position.rotation,
                  scale: isSelected ? 1.15 : (isHovered ? 1.03 : 1),
                  opacity: isOtherSelected ? 0.3 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
                onMouseEnter={() => !selectedCard && setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(card.id)}
              >
                <div className="card-pattern">
                  <Pattern />
                </div>

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
                      {card.link && (
                        <a
                          href={card.link}
                          className="card-link"
                          target={card.link.startsWith('http') ? '_blank' : undefined}
                          rel={card.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {card.linkText || 'Learn more'}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </a>
                      )}
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
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .card-stack-container {
          position: relative;
          width: 100%;
          max-width: 1000px;
          height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cards-wrapper {
          position: relative;
          width: 240px;
          height: 340px;
        }

        .card {
          position: absolute;
          width: 240px;
          height: 320px;
          border-radius: 20px;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          left: 50%;
          top: 50%;
          margin-left: -120px;
          margin-top: -160px;
          transform-origin: center center;
        }

        .card-selected {
          width: 320px;
          height: auto;
          min-height: 320px;
          margin-left: -160px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
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
        }

        .card-selected .card-title {
          font-size: 1.75rem;
        }

        .card-subtitle {
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
          opacity: 0.9;
        }

        .card-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          padding: 10px 18px;
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
          z-index: 1;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .cards-wrapper {
            transform: scale(0.9);
          }
        }

        @media (max-width: 768px) {
          .card-stack-hero {
            padding: 2rem 1rem;
            min-height: 400px;
          }

          .card-stack-container {
            height: 380px;
          }

          .cards-wrapper {
            transform: scale(0.75);
          }

          .card-selected {
            width: 280px;
            margin-left: -140px;
          }

          .card-selected .card-title {
            font-size: 1.4rem;
          }
        }

        @media (max-width: 480px) {
          .cards-wrapper {
            transform: scale(0.6);
          }

          .card-stack-container {
            height: 320px;
          }

          .card-selected {
            width: 260px;
            margin-left: -130px;
          }
        }
      `}</style>
    </div>
  );
}
