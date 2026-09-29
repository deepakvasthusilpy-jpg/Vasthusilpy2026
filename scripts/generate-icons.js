import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
const logoSvgPath = path.join(publicDir, 'vasthusilpy_logo.svg');

if (!fs.existsSync(logoSvgPath)) {
  console.error('Logo SVG not found at:', logoSvgPath);
  process.exit(1);
}

const svgBuffer = fs.readFileSync(logoSvgPath);

// Copy icon.svg
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgBuffer);

async function generateIcons() {
  console.log('Generating PWA icons...');

  // 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 180x180 Apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Maskable 512x512 icon (with 15% safe zone padding and solid #0f172a / #E60000 background)
  // Inner image resized to 410x410 and placed on a 512x512 canvas with red background
  const innerResized = await sharp(svgBuffer)
    .resize(410, 410)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 230, g: 0, b: 0, alpha: 1 } // #E60000
    }
  })
    .composite([{ input: innerResized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Successfully generated all PWA icons!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
