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
      David Hoang is a Designer{' '}
      <a
        href="https://www.youtube.com/watch?v=4lWYcr53kyI"
        target="_blank"
        rel="noopener noreferrer"
        className="and-link"
        onClick={(e) => e.stopPropagation()}
      >and</a>{' '}
      {role.link ? (
        <a
          href={role.link}
          target="_blank"
          rel="noopener noreferrer"
          className="role-link"
          onClick={(e) => e.stopPropagation()}
        >
          {role.label}
        </a>
      ) : (
        <span className="role-text">{role.label}</span>
      )}.
    </motion.h1>
  );
}
