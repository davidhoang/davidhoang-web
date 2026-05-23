import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { rotatingRoles } from './types';

interface HeroTitleProps {
  hasSelection: boolean;
  className?: string;
  /** When false, headline stays slightly below and transparent until hero is ready */
  isVisible?: boolean;
}

// Pick a random role once on module load so it's stable for the session
const initialRoleIndex = Math.floor(Math.random() * rotatingRoles.length);

export function HeroTitle({ hasSelection, className, isVisible = true }: HeroTitleProps) {
  const [roleIndex] = useState(initialRoleIndex);
  const role = rotatingRoles[roleIndex];
  const roleAriaLabel = role.link.startsWith('http')
    ? `${role.label} — Proof of Concept newsletter (opens in new tab)`
    : `${role.label} — Investing (opens in new tab)`;

  const textRef = useRef<HTMLSpanElement>(null);
  const [underlineWidth, setUnderlineWidth] = useState<number | null>(null);

  useEffect(() => {
    const node = textRef.current;
    if (!node) return;

    const measure = () => {
      const current = textRef.current;
      if (!current) return;
      // The span is display: inline-block, so its width = rendered text width.
      const width = current.getBoundingClientRect().width;
      if (width > 0) setUnderlineWidth(width);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [role.label]);

  return (
    <motion.h1
      className={`hero-title ${className || ''}`}
      initial={{ opacity: 0, y: 22 }}
      animate={{
        y: isVisible ? (hasSelection ? -30 : 0) : 22,
        opacity: isVisible ? (hasSelection ? 0.6 : 1) : 0,
      }}
      transition={{
        y: { type: 'spring', stiffness: 380, damping: 32 },
        opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      David Hoang is a Designer and{' '}
      <a
        href={role.link}
        className="role-link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={roleAriaLabel}
      >
        <span className="role-link__label">
          <span ref={textRef} className="role-link__text">{role.label}</span>
          <svg
            className="role-link__underline"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={underlineWidth ? { width: `${underlineWidth}px` } : undefined}
          >
            <path
              d="M0,5 L100,5"
              fill="none"
              stroke="var(--marker-color, #FF6B35)"
              strokeWidth="6"
              strokeLinecap="butt"
              strokeOpacity="0.92"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
      </a>
      .
    </motion.h1>
  );
}
