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

       // Font size configuration
        const baseFontSize = 42;
        const maxFontSize = 46;
        const minFontSize = 28;

        // Character length thresholds
        const shortLimit = 10;
        const softLimit = 17;
        const hardLimit = 40;

        const len = (name ?? '').trim().length;

        // Clamp value to range [0, 1]
        const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

        // Smooth size transitions
        const easeOutQuad = (x: number) => 1 - (1 - x) * (1 - x);
        const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

        let fontSize = baseFontSize;

        if (len <= shortLimit) {
        // Increase size 
        const t = clamp01(1 - len / shortLimit);
        const eased = easeOutQuad(t);

        fontSize = Math.round(
            baseFontSize + eased * (maxFontSize - baseFontSize)
        );
        } else if (len <= softLimit) {
            // Base size 
            fontSize = baseFontSize;
        } else {
            // Decrease size 
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
        const outputDir = path.join(__dirname, '..', 'public', 'test');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const birthdayEmployees = await Nusawork.getEmployees();

        await Promise.all(
            birthdayEmployees.map(async (emp) => {
                const safeFileName = emp.full_name
                    .toLowerCase()          
                    .trim()                
                    .replace(/\s+/g, '-')  
                    .replace(/[^a-z0-9-]/g, ''); 

                const outputFilePath = path.join(outputDir, `${safeFileName}.png`);

                await this.generateVoucher(
                    emp.full_name,
                    "00/00/0000",
                    outputFilePath
                );
            })
        );
    }
}

Generate.main();
