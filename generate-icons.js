// Node script to generate PWA icons
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 32;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  // Green hat
  ctx.fillStyle = '#2d7a16';
  ctx.fillRect(12 * s, 2 * s, 8 * s, 6 * s);
  ctx.fillRect(10 * s, 5 * s, 12 * s, 3 * s);

  // Face
  ctx.fillStyle = '#ffcc99';
  ctx.fillRect(10 * s, 7 * s, 12 * s, 6 * s);

  // Eyes
  ctx.fillStyle = '#4a2800';
  ctx.fillRect(12 * s, 9 * s, 2 * s, 2 * s);
  ctx.fillRect(18 * s, 9 * s, 2 * s, 2 * s);

  // Body (blue)
  ctx.fillStyle = '#2255aa';
  ctx.fillRect(9 * s, 13 * s, 14 * s, 9 * s);

  // Overalls
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(11 * s, 14 * s, 4 * s, 7 * s);
  ctx.fillRect(17 * s, 14 * s, 4 * s, 7 * s);

  // Belt
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(9 * s, 13 * s, 14 * s, 2 * s);

  // Shoes
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(9 * s, 22 * s, 6 * s, 4 * s);
  ctx.fillRect(17 * s, 22 * s, 6 * s, 4 * s);

  // PixelRift text at bottom
  ctx.fillStyle = '#ffd700';
  ctx.font = `${Math.floor(s * 3.5)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('PIXELRIFT', size / 2, size - s * 2);

  return canvas.toBuffer('image/png');
}

try {
  writeFileSync('./public/icons/icon-192.png', generateIcon(192));
  writeFileSync('./public/icons/icon-512.png', generateIcon(512));
  console.log('Icons generated!');
} catch(e) {
  console.log('Canvas not available, using fallback icons');
  // Create minimal 1x1 transparent PNG as fallback
  const minPng = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk length + type
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // width=1, height=1
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // bit depth=8, color=RGB, crc
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // IDAT chunk
    0x54,0x08,0xD7,0x63,0x1A,0x19,0x28,0x00, // compressed pixel
    0x00,0x00,0x04,0x00,0x01,0xC3,0x0D,0x75, // CRC
    0x66,0x00,0x00,0x00,0x00,0x49,0x45,0x4E, // IEND
    0x44,0xAE,0x42,0x60,0x82              // IEND data
  ]);
  writeFileSync('./public/icons/icon-192.png', minPng);
  writeFileSync('./public/icons/icon-512.png', minPng);
  console.log('Minimal fallback icons written.');
}
