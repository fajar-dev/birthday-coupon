import axios, { AxiosInstance } from 'axios';
import { NUSACONTACT_API_URL, NUSACONTACT_API_KEY, NUSACONTACT_PHONE_ID } from '../config';

const MAX_ATTEMPTS = 16;
const BASE_DELAY = 1000;
const RETRYABLE_CODES = [429];

export class NusaContact {
    private static getClient(): AxiosInstance {
        return axios.create({
            baseURL: NUSACONTACT_API_URL,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': NUSACONTACT_API_KEY,
            },
        });
    }

    private static async delay(attempt: number): Promise<void> {
        const delayTime = BASE_DELAY * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 300);
        await new Promise(resolve => setTimeout(resolve, delayTime));
    }

    static async send(payload: any, phone?: string): Promise<void> {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const res = await this.getClient().post(`/messages?phone_number_id=${NUSACONTACT_PHONE_ID}`, payload);
                console.log(`[${phone}]: Message sent successfully`);
                return;
            } catch (err: any) {
                const status = err?.response?.status;
                const message = err?.response?.data || err.message;

                console.error(`[${phone}]: Attempt ${attempt}/${MAX_ATTEMPTS} - ${status || 'No Status'}: ${message}`);

                if (status === 429) {
                    console.log(`[${phone}]: Rate limit reached. Retrying... Attempt ${attempt}/${MAX_ATTEMPTS}`);
                    await this.delay(attempt);
                    continue;
                }

                if (status && status >= 400 && status < 500 && !RETRYABLE_CODES.includes(status)) {
                    console.error(`[${phone}]:  Non-retryable 4xx error.`);
                    break;
                }

                if (attempt < MAX_ATTEMPTS) {
                    await this.delay(attempt);
                }

                if (attempt >= MAX_ATTEMPTS) {
                    console.error(`[${phone}]: Max retry attempts reached.`);
                }
            }
        }
    }
}
