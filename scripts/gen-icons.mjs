// Generates PNG icons from the SVG using the @resvg/resvg-js package
// Run: node scripts/gen-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { Resvg } from '@resvg/resvg-js';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svg = readFileSync('./public/icon.svg', 'utf8');

mkdirSync('./public/icons', { recursive: true });

for (const size of sizes) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  writeFileSync(`./public/icons/icon-${size}.png`, png);
  console.log(`✓ icon-${size}.png`);
}
