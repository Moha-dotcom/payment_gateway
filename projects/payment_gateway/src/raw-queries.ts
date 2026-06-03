import 'dotenv/config'
import prisma from "../src/config/db"



type PaymentVolumePerMerchantSummary = {
    business_name: string,
    email: string,
    total_volume: string
}

type RevenueByMethod = {
    payment_method: string;
    total_amount: string;
}

type OpenDisputeType = {
    id : string,
    reason: string,
    status: string,
    raised_by: string,
    business_name: string,
    customer_name : string
    payment_amount : string
}


async function getPaymentVolumePerMerchant(merchantId: string): Promise<PaymentVolumePerMerchantSummary[]> {
    return   prisma.$queryRaw<PaymentVolumePerMerchantSummary[]>`
        SELECT
                m.business_name, 
                m.email, 
                SUM(p.amount) as total_volume
        FROM "PAYMENTS" p
        INNER JOIN "MERCHANTS" m ON m.id = p.merchant_id
        WHERE m.status = 'ACTIVE' 
          AND p.payment_status = 'PENDING'  AND m.id = ${merchantId}
        GROUP BY m.business_name, m.email
    `
}



async function getMerchantRevenueByMethod(merchantId : string) : Promise<RevenueByMethod[]> {
    return prisma.$queryRaw<RevenueByMethod[]>`
        SELECT 
           *,
            CASE 
                WHEN p.payment_status = 'SETTLED' THEN 'success' 
                WHEN p.payment_status = 'REFUNDED' THEN 'failed'
           ELSE 'pending'
           END AS status_label
        
--             SUM(CASE
--                 WHEN payment_status = 'REFUNDED' THEN amount ELSE 0 END ) As Total_completed_payment 
        FROM "PAYMENTS" p
        WHERE merchant_id = ${merchantId}
        GROUP BY p.payment_status, p.id
    `
}


async function insertOpenDisputeDemo( ) {
    return prisma.$executeRaw<[]>`
        INSERT INTO "DISPUTES" (id, payment_id, raised_by, status, 
                                reason, resolved_by, resolved_at,  created_at, updated_at
        )
        VALUES (
                   gen_random_uuid(),
                  '51510062-9453-4341-8124-a9a568335d6f',
                    'MERCHANT',
                   'OPEN',
                   'Test dispute',
                   'test',
                   now(),
                   now(),
                   now()
               );`

}




async function getOpenDispute() : Promise<OpenDisputeType[]> {
    return prisma.$queryRaw<OpenDisputeType[]> `
        SELECT 
             d.id, 
             d.reason,
             d.status, 
             d.raised_by, 
             m.business_name, 
             c.name as customer_name,
             p.amount as payment_amount
        FROM "DISPUTES" d
        INNER JOIN "PAYMENTS" p ON p.id = d.payment_id
        INNER JOIN "MERCHANTS" m ON m.id = p.merchant_id
        INNER JOIN "CUSTOMER" c ON c.id= p.customer_id
        WHERE d.status IN ('OPEN', 'UNDER_REVIEW')
    `
}


getOpenDispute().then((dispute) => {
    console.log(dispute)
})





async function suspendMerchant(merchantId : string) : Promise<void | Error | string> {
    if(!merchantId){
        throw new Error('MERCHANT ID required or Merchant Id is not available')
    }else {
        const businessName = await prisma.$queryRaw<[]>`
            UPDATE "MERCHANTS"
            SET status = 'SUSPENDED'
            WHERE id = ${merchantId}
              AND status = 'ACTIVE' RETURNING business_name
        `
        console.log(businessName)

        if (businessName.length > 0) {
        let {business_name} = businessName[0];
        return `${business_name} is suspended`
        }

        throw new Error('Merchant not found or already suspended')


    }
}

suspendMerchant('7d604699-e20c-4cb0-b49c-754bb0032ccf').then((merchantId) => {
    console.log(merchantId)
})


async function getMarchantInfo(merchantId : string) : Promise<void> {
    return prisma.$queryRaw<[]> `
    SELECT * FROM "MERCHANTS"
        WHERE id = ${merchantId}
    `
}

// getMarchantInfo('7d604699-e20c-4cb0-b49c-754bb0032ccf').then((merchantId) => {
//     console.log(merchantId)
// })



// const PAGE_SIZE = 3;
// async function getPaymentByMerchant(merchantId: string, cursor ? : string) {
//     const data = await prisma.payment.findMany({
//         where : {merchantId},
//         take : PAGE_SIZE,
//         cursor : cursor ? { id  : cursor } : undefined,
//         skip : cursor ? 1 : 0
//
//     })
//
//     const hasNextPage = data.length === PAGE_SIZE;
//     const nextCursor =hasNextPage ?  data[data.length - 1].id : null;
//
//         return {data, hasNextPage, nextCursor, dataLength : data.length};
// }
//
// async function createPayment(
//     merchantId : string,
//     customerId : string,
//     amount : number,
//     currency: string,
//     paymentMethod: PaymentMethod,
//     paymentState: PaymentStatus,
//     referenceCode: string,) : Promise<Payment> {
//     return await prisma.payment.create({
//         data: {
//             merchantId: merchantId,
//             customerId: customerId,
//             amount: amount,
//             currency: currency,
//             paymentMethod: paymentMethod,
//             paymentState: paymentState,
//             referenceCode: referenceCode,
//         }
//     });
// }
//
//
//
// try {
//     const result : Payment[] = await prisma.$queryRaw<Payment[]>`
//         SELECT * FROM "PAYMENTS" limit 10`
//     console.log(result)
//     const filename = path.join('/Users/user/Documents/projects/payment_gateway/data.json')
//     result.forEach(async  element => {
//         await fs.writeFile(filename, JSON.stringify(result, null, 2), 'utf8' )
//     })
// }catch(err) {
//     console.log(err)
// }



//
// try {
//     const data = await prisma.payment.findUnique({
//         where: {id : '568a601d-0e9b-4951-8775-268091d9340a'},
//         select: {
//             merchantId : true,
//             customerId : true,
//             amount : true,
//             currency : true,
//             paymentStatus : true,
//             paymentMethod : true,
//             merchant : {
//                 select : {businessName : true,
//                 businessAddress : true,
//                 email : true,
//                 annualRevenue : true}
//
//             },
//             transactionBreakdown : {
//                 select : {
//                     feeRate : true,
//                     feeAmount : true,
//                     netAmount : true,
//                 }
//             }
//         },
//
//     })
//
//
//
//     const result = await prisma.payment.findMany({
//         where: {
//             merchantId : '7d604699-e20c-4cb0-b49c-754bb0032ccf',
//             paymentStatus : { not : 'REFUNDED'},
//             amount : {gte : 100},
//             createdAt : {
//                 gte  : new Date('2026-04-09'),
//                 lte  : new Date('2026-05-09'),
//             },
//
//
//         },
//         select: {
//             merchantId : true,
//             amount : true,
//             currency : true,
//             paymentStatus : true,
//         },
//
//         orderBy :{id : 'desc'},
//         take : 2, skip  : 0
//     })
//     console.log(result)
// }catch (
//     error
//     ){
//     console.log(error)
// }
// //
// // type MerchantSummary = {
// //         merchant_id: string
// //         business_name: string
// //         completed_count: bigint
// //         failed_count: bigint
// //         total_volume: string
// // }
// //
// // async function getMerchantSummary(merchantId: string): Promise<MerchantSummary[]> {
// //     return prisma.$queryRaw<MerchantSummary[]>
// //         `SELECT
// //                 m.id AS merchant_id ,
// //                 m.business_name as business_name,
// //                 COUNT(CASE WHEN p.payment_status = 'COMPLETED' THEN 1 END) AS completed_count,
// //                 COUNT(CASE WHEN p.payment_status = 'FAILED' THEN 1 END) AS failed_count,
// //                 SUM(CASE WHEN p.payment_status = 'COMPLETED' THEN p.amount ELSE 0 END) AS total_volume
// //             FROM "MERCHANTS"
// //                         LEFT JOIN "PAYMENTS" p ON p.merchant_id = m.id
// //                         WHERE m.id = ${merchantId}
// //                         GROUP BY m.id, m.business_name
//         `
// }
//
// getMerchantSummary('7d604699-e20c-4cb0-b49c-754bb0032ccf')
//     .then((result) => {
//     console.log(result)
// })