import { useState } from 'react';
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
const PatternLines = ({ color }: { color: string }) => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.3 }}>
    {Array.from({ length: 20 }).map((_, i) => (
      <line
        key={i}
        x1={5 + i * 5}
        y1="0"
        x2={5 + i * 5}
        y2="100"
        stroke={color === '#1a1a1a' ? '#444' : 'rgba(255,255,255,0.5)'}
        strokeWidth="0.5"
      />
    ))}
  </svg>
);

const PatternGrid = ({ color }: { color: string }) => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.25 }}>
    {Array.from({ length: 10 }).map((_, i) => (
      <g key={i}>
        <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke={color === '#1a1a1a' ? '#444' : 'rgba(255,255,255,0.6)'} strokeWidth="0.3" />
        <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke={color === '#1a1a1a' ? '#444' : 'rgba(255,255,255,0.6)'} strokeWidth="0.3" />
      </g>
    ))}
  </svg>
);

const PatternWaves = ({ color }: { color: string }) => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.3 }}>
    {Array.from({ length: 15 }).map((_, i) => (
      <path
        key={i}
        d={`M 0 ${10 + i * 6} Q 25 ${5 + i * 6}, 50 ${10 + i * 6} T 100 ${10 + i * 6}`}
        fill="none"
        stroke={color === '#1a1a1a' ? '#444' : 'rgba(255,255,255,0.5)'}
        strokeWidth="0.5"
      />
    ))}
  </svg>
);

const PatternDots = ({ color }: { color: string }) => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.3 }}>
    {Array.from({ length: 10 }).map((_, i) =>
      Array.from({ length: 10 }).map((_, j) => (
        <circle
          key={`${i}-${j}`}
          cx={5 + i * 10}
          cy={5 + j * 10}
          r="1"
          fill={color === '#1a1a1a' ? '#444' : 'rgba(255,255,255,0.6)'}
        />
      ))
    )}
  </svg>
);

const PatternCircuits = ({ color }: { color: string }) => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.3 }}>
    <rect x="20" y="20" width="60" height="60" fill="none" stroke="#444" strokeWidth="0.5" rx="4" />
    <rect x="30" y="30" width="40" height="40" fill="none" stroke="#444" strokeWidth="0.5" rx="2" />
    <line x1="20" y1="50" x2="10" y2="50" stroke="#444" strokeWidth="0.5" />
    <line x1="80" y1="50" x2="90" y2="50" stroke="#444" strokeWidth="0.5" />
    <line x1="50" y1="20" x2="50" y2="10" stroke="#444" strokeWidth="0.5" />
    <line x1="50" y1="80" x2="50" y2="90" stroke="#444" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="8" fill="none" stroke="#444" strokeWidth="0.5" />
  </svg>
);

const patterns = {
  lines: PatternLines,
  grid: PatternGrid,
  waves: PatternWaves,
  dots: PatternDots,
  circuits: PatternCircuits,
};

// Card positions for the fanned stack
const cardPositions = [
  { x: -120, y: 20, rotation: -15, zIndex: 1 },
  { x: -60, y: 10, rotation: -8, zIndex: 2 },
  { x: 0, y: 0, rotation: 0, zIndex: 3 },
  { x: 60, y: 10, rotation: 8, zIndex: 4 },
  { x: 120, y: 20, rotation: 15, zIndex: 5 },
];

export default function CardStackHero() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const selectedCardData = cards.find(c => c.id === selectedCard);

  return (
    <div className="card-stack-hero">
      <div className="card-stack-container">
        <div className="cards-wrapper">
          {cards.map((card, index) => {
            const position = cardPositions[index];
            const isHovered = hoveredCard === card.id;
            const isSelected = selectedCard === card.id;
            const Pattern = patterns[card.pattern];

            return (
              <motion.div
                key={card.id}
                className="card"
                style={{
                  backgroundColor: card.color,
                  zIndex: isHovered ? 10 : position.zIndex,
                }}
                initial={false}
                animate={{
                  x: position.x,
                  y: isHovered ? position.y - 20 : position.y,
                  rotate: position.rotation,
                  scale: isHovered ? 1.05 : 1,
                }}
                whileHover={{ scale: 1.05 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedCard(card.id)}
              >
                <div className="card-pattern">
                  <Pattern color={card.color} />
                </div>
                <div className="card-content">
                  <h3 className="card-title">{card.title}</h3>
                  {card.subtitle && <p className="card-subtitle">{card.subtitle}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Expanded card overlay */}
      <AnimatePresence>
        {selectedCard && selectedCardData && (
          <>
            <motion.div
              className="card-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCard(null)}
            />
            <motion.div
              className="card-expanded"
              style={{ backgroundColor: selectedCardData.color }}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                className="card-close"
                onClick={() => setSelectedCard(null)}
                aria-label="Close card"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="card-expanded-pattern">
                {(() => {
                  const Pattern = patterns[selectedCardData.pattern];
                  return <Pattern color={selectedCardData.color} />;
                })()}
              </div>
              <div className="card-expanded-content">
                <h2 className="card-expanded-title">{selectedCardData.title}</h2>
                {selectedCardData.subtitle && (
                  <p className="card-expanded-subtitle">{selectedCardData.subtitle}</p>
                )}
                <p className="card-expanded-description">{selectedCardData.description}</p>
                {selectedCardData.link && (
                  <a
                    href={selectedCardData.link}
                    className="card-expanded-link"
                    target={selectedCardData.link.startsWith('http') ? '_blank' : undefined}
                    rel={selectedCardData.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {selectedCardData.linkText || 'Learn more'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .card-stack-hero {
          width: 100%;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          position: relative;
        }

        .card-stack-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cards-wrapper {
          position: relative;
          width: 200px;
          height: 280px;
        }

        .card {
          position: absolute;
          width: 180px;
          height: 240px;
          border-radius: 16px;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          left: 50%;
          top: 50%;
          margin-left: -90px;
          margin-top: -120px;
        }

        .card-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 40%;
          overflow: hidden;
        }

        .card-content {
          padding: 16px;
          color: white;
          position: relative;
          z-index: 1;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.2;
        }

        .card-subtitle {
          font-size: 0.8rem;
          margin: 4px 0 0 0;
          opacity: 0.8;
        }

        /* Overlay */
        .card-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 100;
          cursor: pointer;
        }

        /* Expanded card */
        .card-expanded {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 500px;
          min-height: 350px;
          border-radius: 24px;
          z-index: 101;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
        }

        .card-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          z-index: 2;
          transition: background 0.2s;
        }

        .card-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .card-expanded-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          overflow: hidden;
        }

        .card-expanded-content {
          margin-top: auto;
          padding: 32px;
          color: white;
          position: relative;
          z-index: 1;
        }

        .card-expanded-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .card-expanded-subtitle {
          font-size: 1.1rem;
          margin: 0 0 16px 0;
          opacity: 0.8;
        }

        .card-expanded-description {
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 24px 0;
          opacity: 0.95;
        }

        .card-expanded-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          transition: background 0.2s;
        }

        .card-expanded-link:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .card-stack-hero {
            padding: 2rem 1rem;
            min-height: 350px;
          }

          .card-stack-container {
            height: 280px;
          }

          .cards-wrapper {
            transform: scale(0.85);
          }

          .card-expanded {
            width: 95%;
            min-height: auto;
          }

          .card-expanded-content {
            padding: 24px;
          }

          .card-expanded-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .cards-wrapper {
            transform: scale(0.75);
          }

          .card-stack-container {
            height: 240px;
          }
        }
      `}</style>
    </div>
  );
}
