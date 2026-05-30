import {Payment, Refund} from "@prisma/client";
import prisma from "../../config/db";

export async function resolveDispute(disputeId : string,
                                     disputeOutCome : 'REJECTED' | 'RESOLVED',
                                     reason : string,
                                     updatedBy : string,
                                     resolvedBy? : string,)
    : Promise<{refundSummary : Refund} |  {paymentSummary : Payment}> {
    return await prisma.$transaction(async (trx ) => {
        const dispute = await trx.dispute.findUnique({where: {id: disputeId}});
        if(!dispute) throw new Error(`Dispute ${disputeId} not found`);
        const payment = await trx.payment.findUnique({where: {id : dispute.paymentId}});
        if(!payment) throw new Error(`Payment is not Found`);
        if(payment.paymentStatus !== 'DISPUTED') throw new Error(`Payment is not Disputed`);
        const resolvedAt : string = new Date().toISOString();
        // Customer Wins
        if(disputeOutCome === 'RESOLVED') {
            const balanceLeft = Number(payment.amount) - Number(payment.refundedAmount);
            await trx.dispute.update({
                where: {id : disputeId },
                data: {
                    status : 'RESOLVED',
                    resolvedBy :resolvedBy,
                    resolvedAt,
                    reason : reason,
                }
            })
            await trx.payment.update({
                where : {id : dispute.paymentId},
                data : {paymentStatus : 'REFUNDED',refundedAmount : payment.amount},
            });
            const refundSummary =  await trx.refund.create({
                data: {paymentId: dispute.paymentId, amount: balanceLeft, status: 'PENDING', reason : reason, updatedBy :updatedBy},
            })
            return {refundSummary}
        }else{
            const updatedDispute  =  await trx.dispute.update({
                where : {id : disputeId},
                data : {status : 'REJECTED',   resolvedBy : resolvedBy, resolvedAt : resolvedAt , reason : reason }
            })
            const paymentSummary = await trx.payment.update({
                where : {id : dispute.paymentId},
                data : {paymentStatus : 'COMPLETED'}
            })
            return { paymentSummary }
        }
    })

}