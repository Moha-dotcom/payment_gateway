
import {PaymentStatus} from "@prisma/client";
import prisma from "../../config/db"


const PAGE_SIZE = 10
export async function getPaymentsByMerchant(merchantId : string, status? : PaymentStatus, cursor? : string  ): Promise<any> {
    const payments = await prisma.payment.findMany({
        where : {merchantId : merchantId , ...(status &&  {paymentStatus : status})},
        orderBy : [{createdAt : 'desc'},{ id: 'desc'}],
        take : PAGE_SIZE,
        cursor : cursor ? {id : cursor} : undefined,
        skip : cursor ? 1 : 0,
    })

    const hasNextPage = payments.length  === PAGE_SIZE;
    const nextCursor = hasNextPage ? payments[payments.length-1].id : null

    return {payments, hasNextPage, nextCursor}
}


export async function updatePaymentStatus(merchantId: string, finalPaymentStatus: PaymentStatus): Promise<{count: number}> {
    const result = await prisma.payment.updateMany({
        where: { merchantId, paymentStatus: 'COMPLETED' },
        data: { paymentStatus: finalPaymentStatus }
    })
    return { count: result.count }
}