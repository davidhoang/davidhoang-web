import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { createResponsiveImage } from '../utils/responsive-images';

interface PhilosophyItem {
  content: string;
  id?: string;
}

interface PortfolioItem {
  text: string;
  link: string;
  linkText: string;
  image: string;
  imageAlt: string;
}

export function AnimatedPhilosophyGrid({ items }: { items: PhilosophyItem[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className="philosophy-grid"
      role="list"
      aria-label="Design philosophy principles"
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.12,
          },
        },
      }}
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          className="philosophy-item"
          role="listitem"
          id={item.id}
          variants={{
            hidden: { opacity: 0, y: 25 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              },
            },
          }}
        >
          <p dangerouslySetInnerHTML={{ __html: item.content }} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 220, damping: 22, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 220, damping: 22, mass: 0.6 });
  const tiltX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const responsiveImage = createResponsiveImage(
    {
      src: item.image,
      alt: item.imageAlt,
      loading: 'lazy',
    },
    'content'
  );

  return (
    <motion.div
      className="portfolio-content"
      role="listitem"
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
    >
      <div className="portfolio-item-text">
        <p>
          {item.text.split(item.linkText)[0]}
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            {item.linkText}
          </a>
          {item.text.split(item.linkText)[1] || ''}
        </p>
      </div>
      <motion.div
        className="portfolio-images"
        style={{
          rotateX: prefersReducedMotion ? 0 : tiltX,
          rotateY: prefersReducedMotion ? 0 : tiltY,
          transformPerspective: 1000,
          willChange: 'transform',
        }}
        whileHover={
          prefersReducedMotion
            ? undefined
            : {
                scale: 1.015,
                transition: { type: 'spring', stiffness: 260, damping: 30, mass: 0.7 },
              }
        }
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={responsiveImage.src}
          srcSet={responsiveImage.srcSet}
          sizes={responsiveImage.sizes}
          alt={responsiveImage.alt}
          loading={responsiveImage.loading}
          decoding="async"
          width="1200"
          height="800"
        />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedPortfolioGrid({
  items,
}: {
  items: PortfolioItem[];
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className="portfolio-grid"
      role="list"
      aria-label="Recent highlights and projects"
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.15,
          },
        },
      }}
    >
      {items.map((item, index) => (
        <PortfolioCard key={index} item={item} />
      ))}
    </motion.div>
  );
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
