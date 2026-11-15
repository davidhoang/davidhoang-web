/**
 * Anti-slop rules — the mechanical subset of the Impeccable craft floor
 * (github.com/pbakaus/impeccable, `skill/reference/craft-floor.md`).
 *
 * These catch the visual defaults that make a page read as AI-generated:
 * gradient text, side-stripe cards, overshoot easing, glow halos, block
 * shadows, decorative glass, kickers above headings, the indigo→violet
 * palette, crushed tracking, and emoji standing in for icons.
 *
 * Human rationale + allowed exceptions: `.agents/skills/product-design/references/anti-slop.md`.
 * Escape hatch (use sparingly, with a reason): put `slop-ok: <rule-id>` in a
 * comment on the flagged line or the line above it.
 */

import { extractStyleBlocks, lineNumberAt } from '../shared.mjs';

/** Selectors where backdrop blur does a job (legibility over moving content). */
const GLASS_ALLOWED_SELECTOR =
  /nav|palette|overlay|modal|dialog|backdrop|timeline|glass-mode|toolbar|popover|menu|sheet|header/i;

/** Known "AI default" gradient stops: indigo/violet/fuchsia SaaS palette. */
const AI_PALETTE_HEX = /#(667eea|764ba2|6366f1|818cf8|8b5cf6|a855f7|7c3aed|9333ea|c084fc|d946ef|ec4899)\b/i;

const PICTOGRAPHIC_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function suppressed(lines, lineIdx, rule) {
  const here = lines[lineIdx] ?? '';
  const above = lines[lineIdx - 1] ?? '';
  const re = new RegExp(`slop-ok:\\s*${rule}\\b`);
  return re.test(here) || re.test(above);
}

/**
 * Iterate innermost CSS blocks `selector { body }` with absolute line offsets.
 * Nested at-rules are handled because only brace-free bodies match.
 */
function* cssBlocks(css, baseLine = 1) {
  const re = /([^{}]*)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selector = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const bodyIndex = m.index + m[1].length + 1;
    yield {
      selector,
      body: m[2],
      bodyLine: baseLine + lineNumberAt(css, bodyIndex) - 1,
    };
  }
}

function declarations(body, bodyLine) {
  const out = [];
  const re = /([a-z-]+)\s*:\s*([^;]+);?/gi;
  let m;
  while ((m = re.exec(body))) {
    out.push({
      prop: m[1].toLowerCase(),
      value: m[2].trim(),
      line: bodyLine + lineNumberAt(body, m.index) - 1,
    });
  }
  return out;
}

function px(value) {
  const m = /(-?\d*\.?\d+)px/.exec(value);
  return m ? Number(m[1]) : 0;
}

function hasNonZeroRadius(body) {
  const m = /border-radius\s*:\s*([^;]+)/.exec(body);
  if (!m) return false;
  return !/^\s*0(px)?\s*$/.test(m[1]);
}

/** Split a box-shadow value into layers on top-level commas. */
function shadowLayers(value) {
  const layers = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      layers.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) layers.push(cur.trim());
  return layers;
}

function isNeutralShadowColor(layer) {
  return /rgba?\(\s*0\s*,\s*0\s*,\s*0|#0{3,4}\b|#0{6}(?:[0-9a-f]{2})?\b|black|transparent|--shadow|--color-shadow|--color-border|currentColor|color-mix\([^)]*(black|--color-text)/i.test(
    layer,
  );
}

/**
 * Audit one CSS string (a stylesheet or an Astro `<style>` block).
 * @param {ReturnType<import('../shared.mjs').createContext>} ctx
 */
export function auditSlopCss(ctx, file, css, baseLine = 1, allLines = css.split('\n')) {
  const add = (line, rule, detail) => {
    if (suppressed(allLines, line - 1, rule)) return;
    ctx.addViolation(file, line, rule, detail);
  };

  // Blank out comments (keeping newlines) so commented-out declarations are ignored
  // and a leading comment can't swallow the next property. Suppressions read allLines.
  const live = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));

  for (const { selector, body, bodyLine } of cssBlocks(live, baseLine)) {
    if (/^@(font-face|property)/.test(selector)) continue;
    const decls = declarations(body, bodyLine);
    const hasGradientBg = /gradient\(/.test(body);
    const drawnShape = /rotate\(/.test(body); // CSS chevrons/arrows built from borders
    let flaggedGradientText = false;

    for (const { prop, value, line } of decls) {
      // 1. Gradient text
      if (
        ((prop === 'background-clip' || prop === '-webkit-background-clip') && /\btext\b/.test(value)) ||
        (prop === '-webkit-text-fill-color' && /transparent/.test(value) && hasGradientBg)
      ) {
        if (hasGradientBg && !flaggedGradientText) {
          flaggedGradientText = true;
          add(line, 'slop-gradient-text', 'Gradient text — carry emphasis with weight or size, not a clipped gradient');
        }
      }

      // 2. Side-stripe borders on cards / callouts / list items
      if (
        /^border-(left|right|inline-start|inline-end)(-width)?$/.test(prop) &&
        !/transparent|none/.test(value) &&
        !/blockquote/i.test(selector) &&
        !drawnShape
      ) {
        const width = px(value);
        const threshold = hasNonZeroRadius(body) ? 2 : 3;
        if (width >= threshold) {
          add(
            line,
            'slop-side-stripe',
            `Colored ${prop} ${width}px accent stripe — use a full hairline border, a tint, or nothing (blockquotes exempt)`,
          );
        }
      }

      // 3. Overshoot / bounce easing
      if (/cubic-bezier\(/.test(value)) {
        for (const m of value.matchAll(/cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g)) {
          const y1 = Number(m[2]);
          const y2 = Number(m[4]);
          if (y1 < -0.1 || y1 > 1.1 || y2 < -0.1 || y2 > 1.1) {
            add(line, 'slop-bounce-easing', `${m[0]} overshoots — use an exponential ease-out token (--ease-emphasized)`);
          }
        }
      }
      if (/^animation(-name)?$/.test(prop) && /\b(bounce|elastic|wobble|jello|rubber-?band|tada|heartbeat)\b/i.test(value)) {
        add(line, 'slop-bounce-easing', `animation "${value}" — bounce/elastic motion reads as template`);
      }

      // 4 & 5. Shadows: hard offset blocks and zero-offset colored glows
      if (prop === 'box-shadow' || prop === 'text-shadow') {
        for (const layer of shadowLayers(value)) {
          if (/^inset\b/.test(layer) || /^none$/.test(layer)) continue;
          const geometry = layer.replace(/#[0-9a-f]{3,8}\b/gi, '').replace(/[a-z-]+\([^()]*(\([^()]*\)[^()]*)*\)/gi, '');
          // Lengths normalized to px (1rem = 1em = 16px).
          const nums = [...geometry.matchAll(/(?<![\w-])(-?\d*\.?\d+)(px|rem|em)?(?![\w-])/g)].map(
            (n) => Number(n[1]) * (n[2] === 'rem' || n[2] === 'em' ? 16 : 1),
          );
          if (nums.length < 3) continue;
          const [x, y, blur, spread = 0] = nums;
          // 1px zero-blur hairlines are an edge technique; ≥2px offset with no blur (and no spread) is a block shadow.
          if (
            prop === 'box-shadow' &&
            Math.max(Math.abs(x), Math.abs(y)) >= 2 &&
            blur === 0 &&
            spread === 0 &&
            nums.length <= 4
          ) {
            add(line, 'slop-hard-offset-shadow', `Zero-blur block shadow "${layer}" — shadows need an offset and a soft blur`);
          }
          if (x === 0 && y === 0 && blur >= 4 && !isNeutralShadowColor(layer)) {
            add(line, 'slop-glow-halo', `Zero-offset colored glow "${layer}" — decoration, not depth`);
          }
        }
      }

      // 6. Decorative glassmorphism
      if (/^(-webkit-)?backdrop-filter$/.test(prop) && /blur\(/.test(value) && !GLASS_ALLOWED_SELECTOR.test(selector)) {
        add(
          line,
          'slop-decorative-glass',
          `backdrop-filter blur on "${selector.slice(0, 60)}" — reserve blur for overlays/sticky chrome over moving content`,
        );
      }

      // 7. AI default palette
      if (/gradient\(/.test(value) && AI_PALETTE_HEX.test(value)) {
        add(line, 'slop-ai-palette', 'Indigo/violet SaaS gradient — use the theme tokens');
      }

      // 8. Crushed tracking
      if (prop === 'letter-spacing') {
        const em = /(-?\d*\.?\d+)em/.exec(value);
        if (em && Number(em[1]) < -0.04) {
          add(line, 'slop-extreme-tracking', `letter-spacing ${value} — floor is -0.04em`);
        }
      }
    }
  }
}

/**
 * Markup checks for .astro / .tsx files.
 * @param {ReturnType<import('../shared.mjs').createContext>} ctx
 */
export function auditSlopMarkup(ctx, file, content) {
  const lines = content.split('\n');

  // Kicker / eyebrow label immediately above a heading.
  const kickerRe =
    /<(p|span|div|small|a)\b[^>]*class(?:Name)?=["{`][^"}`]*(eyebrow|kicker|overline)[^"}`]*["}`][^>]*>(?:(?!<\/\1>)[\s\S])*?<\/\1>\s*<h[1-6]\b/g;
  for (const m of content.matchAll(kickerRe)) {
    if (/--link\b/.test(m[0])) continue; // breadcrumb back-links are navigation, not decoration
    const line = lineNumberAt(content, m.index);
    if (suppressed(lines, line - 1, 'slop-kicker')) continue;
    ctx.addViolation(file, line, 'slop-kicker', 'Eyebrow/kicker above a heading — delete it and let the heading speak');
  }

  // Pictographic emoji standing in for icons (typographic arrows like ↗ → are fine).
  let inStyle = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/<style\b/.test(line)) inStyle = true;
    if (/<\/style>/.test(line)) inStyle = false;
    if (inStyle || /^\s*(\/\/|\*|\/\*)/.test(line)) continue;
    if (PICTOGRAPHIC_EMOJI.test(line) && !suppressed(lines, i, 'slop-emoji-icon')) {
      ctx.addViolation(file, i + 1, 'slop-emoji-icon', 'Emoji as UI iconography — use an SVG icon in the site stroke weight');
    }
  }

  // Scoped styles
  for (const { block, startLine } of extractStyleBlocks(content)) {
    auditSlopCss(ctx, file, block, startLine, lines);
  }
}

/**
 * Tailwind / inline-style class checks (gradient text, bounce, AI palette).
 * @param {ReturnType<import('../shared.mjs').createContext>} ctx
 */
function auditSlopClasses(ctx, file, content) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hit = (rule, detail) => {
      if (!suppressed(lines, i, rule)) ctx.addViolation(file, i + 1, rule, detail);
    };
    if (/\bbg-clip-text\b/.test(line) && /\bbg-gradient-to-/.test(line)) {
      hit('slop-gradient-text', 'bg-clip-text + bg-gradient — gradient text');
    }
    if (/\banimate-bounce\b/.test(line)) hit('slop-bounce-easing', 'animate-bounce');
    if (/\bfrom-(purple|violet|indigo|fuchsia)-\d{3}\b/.test(line)) {
      hit('slop-ai-palette', 'Tailwind purple/violet gradient stop');
    }
    if (/backgroundClip:\s*['"]text['"]/.test(line)) {
      hit('slop-gradient-text', 'backgroundClip: text — gradient text');
    }
  }
}

/**
 * Markup + utility-class checks for .astro and .tsx files.
 * @param {ReturnType<import('../shared.mjs').createContext>} ctx
 */
export function auditSlopComponent(ctx, file, content) {
  auditSlopClasses(ctx, file, content);
  auditSlopMarkup(ctx, file, content);
}

/** Entry point for a single file by extension. */
export function auditSlopFile(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;
  if (file.endsWith('.css')) auditSlopCss(ctx, file, content);
  else if (file.endsWith('.astro') || file.endsWith('.tsx')) auditSlopComponent(ctx, file, content);
}
