import 'dotenv/config'
import {Merchant} from "@prisma/client";
import prisma from "../src/config/db"

type MerchantSummary = {
        merchant_id: string
        business_name: string
        completed_count: bigint
        failed_count: bigint
        total_volume: string
}

async function getMerchantSummary(merchantId: string): Promise<MerchantSummary[]> {
    return prisma.$queryRaw<MerchantSummary[]>
        `SELECT 
                m.id AS merchant_id ,
                m.business_name as business_name,
                COUNT(CASE WHEN p.payment_status = 'COMPLETED' THEN 1 END) AS completed_count,
                COUNT(CASE WHEN p.payment_status = 'FAILED' THEN 1 END) AS failed_count,
                SUM(CASE WHEN p.payment_status = 'COMPLETED' THEN p.amount ELSE 0 END) AS total_volume
            FROM "MERCHANTS"
                        LEFT JOIN "PAYMENTS" p ON p.merchant_id = m.id
                        WHERE m.id = ${merchantId}
                        GROUP BY m.id, m.business_name
        `
}

getMerchantSummary('7d604699-e20c-4cb0-b49c-754bb0032ccf')
    .then((result) => {
    console.log(result)
})