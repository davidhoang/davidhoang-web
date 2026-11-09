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
const faviconIcoPath = join(publicDir, 'favicon.ico');

/** Single PNG embedded in ICO (supported since Windows Vista). */
function writePngAsIco(pngBuffer, outputPath) {
  const imageCount = 1;
  const headerSize = 6 + imageCount * 16;
  const header = Buffer.alloc(headerSize);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(imageCount, 4);

  header[6] = FAVICON_SIZE >= 256 ? 0 : FAVICON_SIZE;
  header[7] = FAVICON_SIZE >= 256 ? 0 : FAVICON_SIZE;
  header[8] = 0;
  header[9] = 0;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(pngBuffer.length, 14);
  header.writeUInt32LE(headerSize, 18);

  writeFileSync(outputPath, Buffer.concat([header, pngBuffer]));
}

await sharp(sourcePath)
  .resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, { fit: 'cover' })
  .png()
  .toFile(appleTouchPath);

const faviconPng = await sharp(sourcePath)
  .resize(FAVICON_SIZE, FAVICON_SIZE, { fit: 'cover' })
  .png()
  .toBuffer();

writeFileSync(faviconPath, faviconSvg, 'utf8');
writePngAsIco(faviconPng, faviconIcoPath);

console.log(`Generated favicons from ${sourcePath}`);
console.log(`  ${relative(rootDir, faviconPath)} -> ${sourcePublicUrl}`);
console.log(`  ${relative(rootDir, faviconIcoPath)} (${FAVICON_SIZE}x${FAVICON_SIZE} PNG-in-ICO)`);
console.log(`  ${relative(rootDir, appleTouchPath)} (${APPLE_TOUCH_SIZE}x${APPLE_TOUCH_SIZE})`);
