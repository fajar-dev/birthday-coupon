// cron.ts
import { NusaContact } from './service/nusacontact';
import { Nusawork } from './service/nusawork';
import { BASE_URL } from './config';

async function main(): Promise<void> {
    try {
        const today = new Date();
        const expiredDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
        
        // Uncomment and use this if you want to fetch actual birthday employees
        // const birthdayEmployees = await Nusawork.getTodayBirthdayEmployees();

        // Sample data for demonstration
        const birthdayEmployees = [
            {
                employee_id: "0202415",
                full_name: "Fajar Rivaldi Chan",
                date_of_birth: "2003-12-13",
                whatsapp: "62895611024559",
            }
        ];

        const rows = await Promise.all(birthdayEmployees.map(async (emp) => {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: emp.whatsapp,
                type: "image",
                image: {
                    link: `${BASE_URL}/birthday-voucher?name=${emp.full_name}&expired=${expiredDate.toLocaleDateString('en-GB')}`,
                    caption: "Halo, " + emp.full_name + "! Selamat ulang tahun!"
                }
            };
            try {
                console.log(`Message sßent to ${emp.whatsapp}`);
                await NusaContact.send(payload, emp.whatsapp);
            } catch (error) {
                console.error(`Error sending message to ${emp.full_name}:`, error);
            }
        }));

        console.log("All tasks finished. Exiting...");
        process.exit(0);
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}
main();
