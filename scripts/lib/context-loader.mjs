/**
 * Context Loader
 *
 * Scans scripts/context/ for mood board images and markdown files.
 * Randomly picks one of each (if available) to feed into the daily
 * theme generator as personal inspiration.
 *
 * Supported files:
 *   - Images: .jpg, .jpeg, .png, .webp
 *   - Text: .md
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTEXT_DIR = join(__dirname, '..', 'context');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MARKDOWN_EXTENSIONS = new Set(['.md']);

const MEDIA_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Pick a random element from an array
 */
function pickRandom(arr) {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Scan the context directory and categorize files
 */
function scanContextDir() {
  let files;
  try {
    files = readdirSync(CONTEXT_DIR);
  } catch {
    return { images: [], markdowns: [] };
  }

  const images = [];
  const markdowns = [];

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      images.push(file);
    } else if (MARKDOWN_EXTENSIONS.has(ext)) {
      markdowns.push(file);
    }
  }

  return { images, markdowns };
}

/**
 * Load an image file as a Claude API content block
 */
function loadImageContentBlock(filename) {
  const filepath = join(CONTEXT_DIR, filename);
  const ext = extname(filename).toLowerCase();
  const mediaType = MEDIA_TYPES[ext];

  if (!mediaType) return null;

  try {
    const data = readFileSync(filepath).toString('base64');
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data,
      },
    };
  } catch (error) {
    console.warn(`Warning: Could not read image ${filename}: ${error.message}`);
    return null;
  }
}

/**
 * Load a markdown file as text
 */
function loadMarkdownText(filename) {
  const filepath = join(CONTEXT_DIR, filename);
  try {
    return readFileSync(filepath, 'utf-8');
  } catch (error) {
    console.warn(`Warning: Could not read markdown ${filename}: ${error.message}`);
    return null;
  }
}

/**
 * Load context from the scripts/context/ folder.
 *
 * Returns:
 *   {
 *     image: { contentBlock, filename } | null,
 *     markdown: { text, filename } | null,
 *   }
 */
export function loadContext() {
  const { images, markdowns } = scanContextDir();

  let image = null;
  let markdown = null;

  // Pick a random image
  const imageFile = pickRandom(images);
  if (imageFile) {
    const contentBlock = loadImageContentBlock(imageFile);
    if (contentBlock) {
      image = { contentBlock, filename: imageFile };
    }
  }

  // Pick a random markdown
  const mdFile = pickRandom(markdowns);
  if (mdFile) {
    const text = loadMarkdownText(mdFile);
    if (text) {
      markdown = { text, filename: mdFile };
    }
  }

  return { image, markdown };
}

/**
 * List all context files
 */
export function listContextFiles() {
  const { images, markdowns } = scanContextDir();
  return { images, markdowns };
}
