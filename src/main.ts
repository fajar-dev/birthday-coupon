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

        // Font sizing behavior
        const baseFontSize = 36; // normal
        const maxFontSize = 44;  // for very short names
        const minFontSize = 24;  // for very long names

        const shortLimit = 10;   // <= this: scale up toward maxFontSize
        const softLimit = 17;    // <= this: keep baseFontSize
        const hardLimit = 40;    // >= this: clamp to minFontSize

        const len = (name ?? '').trim().length;

        const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

        // Easing helpers (smooth transitions)
        const easeOutQuad = (x: number) => 1 - (1 - x) * (1 - x);
        const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

        let fontSize = baseFontSize;

        if (len <= shortLimit) {
            // Short name: increase smoothly from base -> max
            // t: 0 when len == shortLimit, 1 when len == 0
            const t = clamp01(1 - len / shortLimit);
            const eased = easeOutQuad(t);

            fontSize = Math.round(
            baseFontSize + eased * (maxFontSize - baseFontSize)
            );
        } else if (len <= softLimit) {
            // Normal length: keep base
            fontSize = baseFontSize;
        } else {
            // Long name: decrease smoothly from base -> min
            // t: 0 when len == softLimit, 1 when len >= hardLimit
            const t = clamp01((len - softLimit) / (hardLimit - softLimit));
            const eased = easeOutCubic(t);

            fontSize = Math.round(
            baseFontSize - eased * (baseFontSize - minFontSize)
            );
        }

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
            { input: Buffer.from(dateSvg), top: 0, left: 0 },
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
