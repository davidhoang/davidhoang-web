import { useState } from 'react';
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
      {`David Hoang is a Designer and ${role.label}.`}
    </motion.h1>
  );
}
