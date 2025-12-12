import axios, { AxiosInstance } from 'axios'
import { NUSAWORK_API_URL, NUSAWORK_CLIENT_ID, NUSAWORK_CLIENT_SECRET } from '../config'

export class Nusawork {
    private static readonly apiUrl = NUSAWORK_API_URL
    private static readonly clientId = NUSAWORK_CLIENT_ID
    private static readonly clientSecret = NUSAWORK_CLIENT_SECRET

    private static readonly http: AxiosInstance = axios.create({
        baseURL: this.apiUrl,
        headers: {
            Accept: "application/json",
        },
    })

    /**
     * Ambil access token dari Nusawork menggunakan client credentials.
     */
    private static async getToken(): Promise<string> {
        const res = await this.http.post<any>("/auth/api/oauth/token",{
            grant_type: "client_credentials",
            client_id: this.clientId,
            client_secret: this.clientSecret,
        },{
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })

        return res.data.access_token as string
    }

    /**
     * Ambil list karyawan aktif dari Nusawork.
     */
    static async getEmployees(): Promise<any[]> {
        const token = await this.getToken()

        const res = await this.http.post<any>("/emp/api/v4.2/client/employee/filter", {
            fields: { active_status: ["active"] },
            is_paginate: false,
            multi_value: false,
            currentPage: 1,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        
        return (res?.data?.data as any[]) ?? []
    }

    /**
     * Ambil daftar karyawan yang ulang tahun hari ini.
     */
    static async getTodayBirthdayEmployees(
        referenceDate: Date = new Date(),
    ): Promise<any[]> {
        const employees = await this.getEmployees()

        const refMonth = referenceDate.getMonth()
        const refDate = referenceDate.getDate()

        const birthdayEmployees = employees.filter((emp: any) => {
            if (!emp?.date_of_birth) return false
            if (emp.status_join === 'Internship') return false

            const dob = new Date(emp.date_of_birth)
            if (Number.isNaN(dob.getTime())) return false

            return dob.getMonth() === refMonth && dob.getDate() === refDate
        })

        return birthdayEmployees.map((emp: any) => ({
            employee_id: emp.employee_id,
            full_name: emp.full_name,
            date_of_birth: emp.date_of_birth,
            whatsapp: emp.whatsapp,
        }))
    }


}