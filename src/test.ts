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

        const maxChars = 17;
        const defaultFontSize = 48;
        const minFontSize = 32;

        const nameLength = name.length;

        let fontSize = defaultFontSize;

        if (nameLength > maxChars) {
            const scale = maxChars / nameLength;
            fontSize = Math.max(
                Math.floor(defaultFontSize * scale),
                minFontSize
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
                { input: Buffer.from(dateSvg), top: 0, left: 0 }
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
