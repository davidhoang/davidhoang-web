import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, walk, extractStyleBlocks, splitCssRules, rel } from '../shared.mjs';

const HERO_FLUSH_PULL = /margin-top:\s*calc\(\s*-1\s*\*\s*var\(--content-top-padding\)\s*\)/;

function auditHeroWidthInStyleBlock(ctx, file, block, blockStartLine) {
  for (const chunk of splitCssRules(block)) {
    const brace = chunk.indexOf('{');
    if (brace === -1) continue;
    const selector = chunk.slice(0, brace);
    const body = chunk.slice(brace + 1);
    if (!/width:\s*100%/.test(body) || /100vw/.test(body)) continue;
    if (/\.page-header--text/.test(selector)) continue;

    const hitsImageHero =
      /\.page-header--image/.test(selector) ||
      /(?:^|[,{])\s*\.page-header\s*(?:[,{]|$)/.test(selector + '{');

    if (!hitsImageHero) continue;

    const lineInBlock = block.slice(0, block.indexOf(chunk)).split('\n').length - 1;
    ctx.addViolation(
      file,
      blockStartLine + lineInBlock,
      'hero-full-width',
      'Image heroes must not use scoped width:100% — use layout.css + MainLayout critical CSS (100vw breakout)',
    );
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditHeroCssFile(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;

  const r = rel(file);
  const lines = readFileSync(file, 'utf-8').split('\n');
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (HERO_FLUSH_PULL.test(line) && r !== 'src/styles/modules/layout.css') {
      ctx.addViolation(
        file,
        lineNo,
        'hero-flush-centralized',
        'Hero flush is owned by layout.css (main:has padding-top: 0) — remove margin-top pull',
      );
    }

    if (line.includes('/*')) inBlockComment = true;
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }

    if (
      /\.page-header--image/.test(line) &&
      /width:\s*100%/.test(line) &&
      !/100vw/.test(line) &&
      r !== 'src/styles/modules/layout.css'
    ) {
      ctx.addViolation(
        file,
        lineNo,
        'hero-full-width',
        'Do not set width:100% on .page-header--image — full bleed is framework-owned (100vw)',
      );
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditHeroAstro(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;

  for (const { block, startLine } of extractStyleBlocks(content)) {
    for (let i = 0; i < block.split('\n').length; i++) {
      const line = block.split('\n')[i];
      if (HERO_FLUSH_PULL.test(line)) {
        ctx.addViolation(
          file,
          startLine + i,
          'hero-flush-centralized',
          'Hero flush is owned by layout.css — remove margin-top pull from scoped styles',
        );
      }
    }
    auditHeroWidthInStyleBlock(ctx, file, block, startLine);
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAllHero(ctx) {
  for (const file of walk(join(ROOT, 'src', 'styles'), '.css')) {
    auditHeroCssFile(ctx, file);
  }
}
