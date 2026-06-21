import sharp from 'sharp';
import { writeFileSync, existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');

const DEFAULT_SOURCE = join(publicDir, 'images', 'img-dh-square.webp');
const APPLE_TOUCH_SIZE = 180;
const FAVICON_SIZE = 32;

const sourceArg = process.argv[2];
const sourcePath = sourceArg
  ? (sourceArg.startsWith('/') ? sourceArg : join(process.cwd(), sourceArg))
  : DEFAULT_SOURCE;

if (!existsSync(sourcePath)) {
  console.error(`Source image not found: ${sourcePath}`);
  process.exit(1);
}

const sourceRelativeToPublic = relative(publicDir, sourcePath).replace(/\\/g, '/');
const sourcePublicUrl = `/${sourceRelativeToPublic}`;

const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${FAVICON_SIZE}" height="${FAVICON_SIZE}" viewBox="0 0 ${FAVICON_SIZE} ${FAVICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle">
      <circle cx="16" cy="16" r="16"/>
    </clipPath>
  </defs>
  <image width="${FAVICON_SIZE}" height="${FAVICON_SIZE}" href="${sourcePublicUrl}" clip-path="url(#circle)"/>
</svg>
`;

const appleTouchPath = join(publicDir, 'apple-touch-icon.png');
const faviconPath = join(publicDir, 'favicon.svg');

await sharp(sourcePath)
  .resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, { fit: 'cover' })
  .png()
  .toFile(appleTouchPath);

writeFileSync(faviconPath, faviconSvg, 'utf8');

console.log(`Generated favicons from ${sourcePath}`);
console.log(`  ${relative(rootDir, faviconPath)} -> ${sourcePublicUrl}`);
console.log(`  ${relative(rootDir, appleTouchPath)} (${APPLE_TOUCH_SIZE}x${APPLE_TOUCH_SIZE})`);
