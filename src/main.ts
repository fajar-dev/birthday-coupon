import { Hono } from 'hono';
import sharp from 'sharp';
import { Nusawork } from './service/nusawork';

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
            font-family="Brush Script MT, cursive" 
            font-size="64" 
            font-weight="bold"
            fill="#FDD576"
            filter="url(#shadow)">${name}</text>
    </svg>
  `;

  const dateSvg = `
    <svg width="${width}" height="${height}">
      <text x="185" y="1020" 
            font-family="Arial, sans-serif" 
            font-size="32" 
            font-weight="bold"
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

  const base64Image = imageBuffer.toString('base64');
  return base64Image;
}

app.get('/', async (c) => {
  try {
    const today = new Date();
    const expiredDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const birthdayEmployees = await Nusawork.getTodayBirthdayEmployees();
    
    const rows = await Promise.all(birthdayEmployees.map(async (emp) => {
      const image = await generateCoupon(emp.full_name, expiredDate.toLocaleDateString('en-GB'));
      return {
        name: emp.full_name,
        expiredDate: expiredDate,
        image: image,
        whatsapp: emp.whatsapp,
      };
    }));

    const base64ImageURL = `data:image/png;base64,${rows[0]?.image}`;

    return c.html(`
      <html>
        <body>
          <h1>Birthday Coupon</h1>
          <p>Name: ${rows[0]?.name}</p>
          <p>Expired Date: ${rows[0]?.expiredDate}</p>
          <img src="${base64ImageURL}" alt="Coupon Image" />
        </body>
      </html>
    `);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
