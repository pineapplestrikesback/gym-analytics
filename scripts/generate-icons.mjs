import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svgPath = join(publicDir, 'favicon.svg');

const svgBuffer = readFileSync(svgPath);

// Generate transparent PNGs for Android/Desktop
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(join(publicDir, 'pwa-192x192.png'));

await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(join(publicDir, 'pwa-512x512.png'));

// Generate iOS icon with dark background (iOS doesn't support transparency)
await sharp(svgBuffer)
  .resize(180, 180)
  .flatten({ background: '#09090b' })
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));

console.log('Icons generated successfully!');
