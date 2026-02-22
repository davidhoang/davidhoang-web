import { useState } from 'react';
import { motion } from 'framer-motion';
import { rotatingRoles } from './types';

interface HeroTitleProps {
  hasSelection: boolean;
  className?: string;
}

// Pick a random role once on module load so it's stable for the session
const initialRoleIndex = Math.floor(Math.random() * rotatingRoles.length);

export function HeroTitle({ hasSelection, className }: HeroTitleProps) {
  const [roleIndex] = useState(initialRoleIndex);
  const role = rotatingRoles[roleIndex];

  return (
    <motion.h1
      className={`hero-title ${className || ''}`}
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
      {`David Hoang is a Designer and ${role.label}.`}
    </motion.h1>
  );
}
