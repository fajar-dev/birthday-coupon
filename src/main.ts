import { Nusawork } from './nusawork';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

class Generate {
    private static async generateVoucher(
        name: string,
        expiredDate: string,
        outputPath: string
    ) {
    const templatePath = './public/birthday-voucher-template.png';

    const templateMeta = await sharp(templatePath).metadata();
    const { width = 1080, height = 1080 } = templateMeta;

    const defaultFontSize = 40;
    const minFontSize = 28;

    const softLimit = 17;  
    const hardLimit = 40;

    const len = name.trim().length;

    // Fungsi clamp 0..1
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    // Normalisasi panjang: 0 saat <= softLimit, 1 saat >= hardLimit
    const t = clamp01((len - softLimit) / (hardLimit - softLimit));

    // Kurva halus (easeOutCubic): turun pelan dulu, makin turun saat makin panjang
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    const eased = easeOutCubic(t);

    // Interpolasi dari default -> min
    const fontSize = Math.round(
        defaultFontSize - eased * (defaultFontSize - minFontSize)
    );

    const nameSvg = `
        <svg width="${width}" height="${height}">
        <defs>
            <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
            </filter>
        </defs>
        <text x="68" y="555"
            font-family="cursive"
            font-size="${fontSize}"
            font-weight="700"
            fill="#FFD533"
            filter="url(#shadow)">
            ${name}
        </text>
        </svg>
    `;

    const dateSvg = `
        <svg width="${width}" height="${height}">
        <text x="185" y="1020"
            font-family="sans-serif"
            font-size="27"
            font-weight="600"
            fill="#FFFFFF">
            ${expiredDate}
        </text>
        </svg>
    `;

    await sharp(templatePath)
        .composite([
        { input: Buffer.from(nameSvg), top: 0, left: 0 },
        { input: Buffer.from(dateSvg), top: 0, left: 0 }
        ])
        .png()
        .toFile(outputPath);
    }

    static async main(): Promise<void> {
        try {
            const today = new Date();
            const expiredDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
            
            const birthdayEmployees = await Nusawork.getTodayBirthdayEmployees();

            const outputDir = path.join(__dirname, '..', 'public', 'voucher');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
    
            await Promise.all(birthdayEmployees.map(async (emp) => {
                const outputFilePath = path.join(outputDir, `${emp.employee_id}.png`);
                await this.generateVoucher(emp.full_name, expiredDate.toLocaleDateString('en-GB'), outputFilePath);
                console.log(`Generated voucher for ${emp.employee_id}`);
            }));
    
            console.log("All tasks finished. Exiting...");
            process.exit(0);
        } catch (error) {
            console.error("An error occurred:", error);
            process.exit(1);
        }
    }
}

Generate.main();
