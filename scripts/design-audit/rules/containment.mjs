import { join } from 'path';
import { ROOT, readContent, splitCssRules, walk, extractStyleBlocks } from '../shared.mjs';

const WRAPPER_CLASS = /\.content-filter-wrapper(?![\w-])/;
const HERO_OR_NAV = /\.(?:hero-card|card-stack-hero|site-nav)(?![\w-])/;

const SIZE_CONTAIN = /\bcontain\s*:\s*[^;]*(strict|size|paint|layout)\b/;
const WILL_CHANGE_FILTER = /\bwill-change\s*:\s*[^;]*\bfilter\b/;
const CONTENT_VISIBILITY_AUTO = /\bcontent-visibility\s*:\s*auto\b/;
const PAINT_OR_STRICT = /\bcontain\s*:\s*[^;]*(strict|size|paint)\b/;

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function selectorList(rule) {
  const open = rule.indexOf('{');
  return open === -1 ? '' : rule.slice(0, open);
}

function body(rule) {
  const open = rule.indexOf('{');
  const close = rule.lastIndexOf('}');
  if (open === -1 || close === -1) return '';
  return rule.slice(open + 1, close);
}

function targetsWrapper(selector) {
  return selector.split(',').some((part) => {
    const tokens = part.trim().split(/\s+/);
    const last = tokens[tokens.length - 1] || '';
    return WRAPPER_CLASS.test(last) && !/[>+~]/.test(part.trim().replace(last, ''));
  });
}

function targetsHeroOrNav(selector) {
  return selector.split(',').some((part) => {
    const last = (part.trim().split(/\s+/).pop() || '');
    return HERO_OR_NAV.test(last);
  });
}

/**
 * @param {ReturnType<import('../shared.mjs').createContext>} ctx
 * @param {string} file
 * @param {string} css
 */
function auditCssText(ctx, file, css) {
  const stripped = stripComments(css);
  for (const rule of splitCssRules(stripped)) {
    const sel = selectorList(rule);
    const b = body(rule);

    if (targetsWrapper(sel)) {
      if (SIZE_CONTAIN.test(b)) {
        ctx.addViolation(
          file,
          1,
          'containment-no-wrapper-contain',
          '.content-filter-wrapper must not use contain (clips hero tuck / traps fixed descendants). Use isolation only (PC-8).',
        );
      }
      if (WILL_CHANGE_FILTER.test(b)) {
        ctx.addViolation(
          file,
          1,
          'containment-no-wrapper-will-change',
          '.content-filter-wrapper must not use will-change: filter (full-page compositor layer).',
        );
      }
    }

    if (targetsHeroOrNav(sel)) {
      if (CONTENT_VISIBILITY_AUTO.test(b)) {
        ctx.addViolation(
          file,
          1,
          'containment-no-hero-content-visibility',
          'Do not set content-visibility on .hero-card, .card-stack-hero, or .site-nav (LCP / overlapping tiles).',
        );
      }
      if (PAINT_OR_STRICT.test(b)) {
        ctx.addViolation(
          file,
          1,
          'containment-no-hero-paint',
          'Do not set contain: paint|size|strict on .hero-card, .card-stack-hero, or .site-nav.',
        );
      }
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditContainment(ctx) {
  for (const file of walk(join(ROOT, 'src', 'styles'), '.css')) {
    auditCssText(ctx, file, readContent(file));
  }

  for (const file of walk(join(ROOT, 'src'), '.astro')) {
    const content = readContent(file);
    for (const { block } of extractStyleBlocks(content)) {
      auditCssText(ctx, file, block);
    }
  }
}
