import {Payment, PaymentStatus, Prisma} from "@prisma/client";
import prisma from "../../config/db";

export async function getPaymentsByStatus(merchantId : string ,
                                          trx: Prisma.TransactionClient ,
                                          periodStart : Date, periodEnd : Date, paymentStatus? : PaymentStatus,): Promise<Payment[]> {
    return  trx.payment.findMany({
        where : {merchantId : merchantId, paymentStatus : paymentStatus,
            createdAt : {gte : periodStart, lte : periodEnd,}},
        include : {transactionBreakdown : true}
    })
}

function calculateGrossAmount(allCompletedPayments: Payment[]) {
    return allCompletedPayments.reduce<Record<string, number>>((acc, currValue)  => {
        acc.totalGross += Number(currValue.amount);
        acc.feeDeduction += Number( currValue.transactionBreakdown?.feeAmount ?? 0)

        return acc;
    }, {totalGross : 0, feeDeduction : 0})
}

function calculateDisputeHeld(allDisputedPayments: Payment[]) {
    return allDisputedPayments.reduce<Record<string, number>>((acc, currValue) => {
        acc.totalDisputeAmount += Number(currValue.amount);
        return acc;
    }, {totalDisputeAmount : 0})
}

export async function runSettlement(merchantId : string, periodStart : Date  , periodEnd : Date) {
    return await prisma.$transaction(async (trx) => {
        // 1. Find all COMPLETED payments for merchant between periodStart and periodEnd, include transactionBreakdown
        const allCompletedPayments =  await getPaymentsByStatus(merchantId, trx, periodStart, periodEnd, 'COMPLETED');
        const allDisputedPayments =  await getPaymentsByStatus(merchantId, trx, periodStart, periodEnd, 'DISPUTED');

        if(allCompletedPayments.length === 0){throw new Error('No Completed Payment Available') }

        const grossAmount = calculateGrossAmount(allCompletedPayments);
        const disputeHeld = calculateDisputeHeld(allDisputedPayments);
        const settlementAmount =
            grossAmount.totalGross - grossAmount.feeDeduction - disputeHeld.totalDisputeAmount;
        // 4. Create Settlement
        const settlement = await trx.settlement.create({
            data : {
                merchantId : merchantId,
                periodEnd ,
                periodStart,
                settledBy : 'SYSTEM',
                settlementAmount,
                status : 'COMPLETED',

            }
        })
        await trx.settlementPayment.createMany({
            data : allCompletedPayments.map((payment) => ({
                paymentId : payment.id,
                settlementId : settlement.id,
            }))
        })
        await trx.payment.updateMany({
            where: { id: { in: allCompletedPayments.map(p => p.id) } },
            data: { paymentStatus : 'SETTLED' }
        })

        const settlementBreakDown = await trx.settlementBreakdown.create({
            data : {
                feeDeduction : grossAmount.feeDeduction,
                grossAmount : grossAmount.totalGross,
                netAmount : settlementAmount,
                settlementId : settlement.id,
                disputesHeld : disputeHeld.totalDisputeAmount,
            }
        })

        return {settlement ,  settlementBreakDown}

    })

}