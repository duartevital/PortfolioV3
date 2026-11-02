import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;
const PORTRAIT_SIZE = 300;
const PORTRAIT_LEFT = 820;
const PORTRAIT_TOP = (HEIGHT - PORTRAIT_SIZE) / 2;

const glyphs = '0101{}<>/;=';

function hash(n) {
  let h = Math.imul(n + 1, 2654435761);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return (h ^ (h >>> 13)) >>> 0;
}
const glyphRows = Array.from({ length: Math.ceil(HEIGHT / 26) }, (_, row) =>
  Array.from({ length: Math.ceil(WIDTH / 22) }, (_, col) => {
    const glyph = glyphs[hash(row * 1000 + col) % glyphs.length];
    return `<text x="${col * 22 + 11}" y="${row * 26 + 18}">${glyph === '<' ? '&lt;' : glyph === '>' ? '&gt;' : glyph}</text>`;
  }).join('')
).join('');

const background = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="fade" cx="30%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0a0a0a" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0.2" />
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0a0a0a" />
  <g fill="#232323" font-family="Consolas, Menlo, monospace" font-size="15" text-anchor="middle">${glyphRows}</g>
  <rect width="100%" height="100%" fill="url(#fade)" />
  <circle cx="${PORTRAIT_LEFT + PORTRAIT_SIZE / 2}" cy="${HEIGHT / 2}" r="${PORTRAIT_SIZE / 2 + 6}" fill="none" stroke="#6b8f71" stroke-width="3" />
  <g font-family="Segoe UI, Helvetica, Arial, sans-serif">
    <text x="90" y="235" fill="#6b8f71" font-size="26" letter-spacing="4">UTRECHT, NETHERLANDS</text>
    <text x="86" y="330" fill="#e8e8e8" font-size="84" font-weight="700">Duarte Vital</text>
    <text x="90" y="395" fill="#e8e8e8" font-size="40">Software Engineer</text>
    <text x="90" y="450" fill="#6b6b6b" font-size="26">.NET · C# · Vue · Angular · TypeScript · Azure</text>
  </g>
</svg>`;

const portrait = await sharp('src/assets/portrait.jpg')
  .resize(PORTRAIT_SIZE, PORTRAIT_SIZE, { fit: 'cover', position: 'attention' })
  .composite([
    {
      input: Buffer.from(
        `<svg width="${PORTRAIT_SIZE}" height="${PORTRAIT_SIZE}"><circle cx="${PORTRAIT_SIZE / 2}" cy="${PORTRAIT_SIZE / 2}" r="${PORTRAIT_SIZE / 2}" /></svg>`
      ),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

await sharp(Buffer.from(background))
  .composite([{ input: portrait, left: PORTRAIT_LEFT, top: PORTRAIT_TOP }])
  .png()
  .toFile('public/og-image.png');
