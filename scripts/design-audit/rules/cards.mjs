import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, walk } from '../shared.mjs';

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditCardsInFile(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;

  const lines = readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\.card-glass\b|cards\.style:\s*["']glass["']|data-card-style=["']glass["']/.test(line)) {
      if (/card-glass-mode|card-glass-overlay|promotes.*glass|normalize.*glass/.test(line)) continue;
      ctx.addViolation(
        file,
        i + 1,
        'no-glass-cards',
        'Cards must be opaque — do not add glass card styles (design.md)',
      );
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAllCards(ctx) {
  for (const file of walk(join(ROOT, 'src', 'styles'), '.css')) {
    auditCardsInFile(ctx, file);
  }
  for (const file of walk(join(ROOT, 'src'), '.astro')) {
    auditCardsInFile(ctx, file);
  }
  for (const file of walk(join(ROOT, 'src'), '.tsx')) {
    auditCardsInFile(ctx, file);
  }
}
