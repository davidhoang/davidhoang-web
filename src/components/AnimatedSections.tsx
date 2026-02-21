import { motion, useInView } from 'framer-motion';
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
        <motion.div
          key={index}
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
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.linkText}
              </a>
              {item.text.split(item.linkText)[1] || ''}
            </p>
          </div>
          <div className="portfolio-images">
            {(() => {
              const responsiveImage = createResponsiveImage({
                src: item.image,
                alt: item.imageAlt,
                loading: 'lazy'
              }, 'content');
              
              return (
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
              );
            })()}
          </div>
        </motion.div>
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
