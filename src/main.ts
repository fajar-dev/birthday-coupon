import { Hono } from 'hono';
import sharp from 'sharp';
import { PORT } from './config';

const app = new Hono();

async function generateCoupon(name: string, expiredDate: string) {
  const templatePath = './public/birthday-voucher-template.png';
  
  const templateMeta = await sharp(templatePath).metadata();
  const { width = 1080, height = 1080 } = templateMeta;

  const nameSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
        </filter>
      </defs>
      <text x="68" y="555" 
            font-family="cursive"
            font-size="48" 
            font-weight="700"
            fill="#FFD533"
            filter="url(#shadow)">${name}</text>
    </svg>
  `;

  const dateSvg = `
    <svg width="${width}" height="${height}">
      <text x="180" y="1020" 
            font-family="sans-serif" 
            font-size="26" 
            font-weight="600"
            fill="#FFFFFF">${expiredDate}</text>
    </svg>
  `;

  const imageBuffer = await sharp(templatePath)
    .composite([
      { input: Buffer.from(nameSvg), top: 0, left: 0 },
      { input: Buffer.from(dateSvg), top: 0, left: 0 }
    ])
    .png()
    .toBuffer();

  return imageBuffer;
}

app.get('/birthday-voucher', async (c) => {
  const { name, expired } = c.req.query();

  try {
    const imageBuffer = await generateCoupon(name, expired);
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png'
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`🚀 Server running on http://localhost:${PORT}`);