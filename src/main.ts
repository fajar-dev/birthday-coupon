import { Nusawork } from './nusawork';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

class Generate {
    private static async generateVoucher(name: string, expiredDate: string, outputPath: string) {
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
            <text x="185" y="1020" 
                    font-family="sans-serif" 
                    font-size="27" 
                    font-weight="600"
                    fill="#FFFFFF">${expiredDate}</text>
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
