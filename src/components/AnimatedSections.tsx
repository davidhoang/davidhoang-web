import { motion, MotionConfig } from 'framer-motion';
import { type ReactNode, useEffect, useRef } from 'react';
import { useReducedMotionPreference as useReducedMotion } from '../hooks/useReducedMotionPreference';
import { useSharedInView } from '../hooks/useSharedInView';

import { motionPresets, revealStagger } from '../utils/motion';

interface PhilosophyItem {
  content: string;
  id?: string;
}

interface OptimizedImage {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
}

interface PortfolioItem {
  text: string;
  link: string;
  linkText: string;
  image: OptimizedImage;
  imageAlt: string;
}

export function AnimatedPhilosophyGrid({ items }: { items: PhilosophyItem[] }) {
  const { ref, isInView } = useSharedInView({ once: true, margin: '-24px' });
  const prefersReducedMotion = useReducedMotion();

  const itemVariants = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            ...motionPresets.reveal,
          },
        },
      };

  return (
    <MotionConfig reducedMotion="user">
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
          transition: prefersReducedMotion ? undefined : { staggerChildren: revealStagger(items.length) },
        },
      }}
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          className="philosophy-item"
          role="listitem"
          id={item.id}
          variants={itemVariants}
        >
          <p dangerouslySetInnerHTML={{ __html: item.content }} />
        </motion.div>
      ))}
    </motion.div>
    </MotionConfig>
  );
}

function useLazyImageLoadedClass() {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;

    const markLoaded = () => {
      img.classList.add('loaded');
    };

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
      return;
    }

    img.addEventListener('load', markLoaded, { once: true });
    img.addEventListener('error', markLoaded, { once: true });
  }, []);

  return ref;
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const prefersReducedMotion = useReducedMotion();
  const imageRef = useLazyImageLoadedClass();

  const itemVariants = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 1, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            ...motionPresets.reveal,
          },
        },
      };

  return (
    <motion.div
      className="portfolio-content card"
      role="listitem"
      variants={itemVariants}
    >
      <div className="portfolio-images img-frame">
        <img
          ref={imageRef}
          className="img-themed"
          src={item.image.src}
          srcSet={item.image.srcSet}
          sizes={item.image.sizes}
          alt={item.imageAlt}
          loading="lazy"
          decoding="async"
          width={item.image.width}
          height={item.image.height}
        />
      </div>
      <div className="portfolio-item-text">
        <p className="text-body">
          {item.text.split(item.linkText)[0]}
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            {item.linkText}
          </a>
          {item.text.split(item.linkText)[1] || ''}
        </p>
      </div>
    </motion.div>
  );
}

export function AnimatedPortfolioGrid({
  items,
}: {
  items: PortfolioItem[];
}) {
  const { ref, isInView } = useSharedInView({ once: true, margin: '-24px' });
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
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
          transition: prefersReducedMotion ? undefined : { staggerChildren: revealStagger(items.length) },
        },
      }}
    >
      {items.map((item, index) => (
        <PortfolioCard key={index} item={item} />
      ))}
    </motion.div>
    </MotionConfig>
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
  const { ref, isInView } = useSharedInView({ once: true, margin: '-24px' });
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
    <motion.div
      ref={ref}
      className={['animated-section', className].filter(Boolean).join(' ')}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              ...motionPresets.reveal,
              delay: Math.min(delay, 0.18),
            }
      }
    >
      {children}
    </motion.div>
    </MotionConfig>
  );
}
