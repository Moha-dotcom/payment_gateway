
import prisma from '../../config/db.js'
import {Currency, Dispute, Payment, PaymentMethod, PaymentStatus, Prisma,
    RaisedBy, Refund, TransactionBreakdown } from "@prisma/client";
import winston from "winston";

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});





export async function getPaymentWithBreakDown(paymentId : string) {
    return await prisma.payment.findUnique({
        where: {id : paymentId },
        select: {
            id: true,
            amount: true,
            currency: true,
            paymentStatus: true,
            paymentMethod: true,
            referenceCode: true,
            createdAt: true,
            merchant: {
                select: { id: true, businessName: true, email: true }
            },
            customer: {
                select: { id: true, name: true, email: true }
            },
            transactionBreakdown: {
                select: { feeRate: true, feeAmount: true, netAmount: true }
            }
        },

    })
}
export async function getAllPayments(merchantId : string) {
    return await prisma.payment.findMany({
        where : {merchantId : merchantId },
    })
}
export async function processRefund(paymentId : string, amount :number, reason :string) {
    logger.info('processRefund', paymentId);
    return await prisma.$transaction(async (trx) => {
        const payment = await trx.payment.findUnique({
            where: {id : paymentId },
            select: {
                id: true,
                amount: true,
                currency: true,
                paymentStatus: true,
                paymentMethod: true,
                referenceCode: true,
                refundedAmount: true,
            }
        })
        if (!payment) throw new Error(`Payment ${paymentId} not found`)
        if(payment.paymentStatus !== "COMPLETED") {throw  new Error(`${payment.paymentStatus} Cannot refund a non-completed payment`) }
        const refundedAmount = Number( payment.refundedAmount)
        const paymentAmount  = Number(payment.amount); // 100
        const newRefundedTotal = refundedAmount + amount
        logger.info(`${refundedAmount}, ${paymentAmount}` );
        if(newRefundedTotal > paymentAmount)    throw new Error(`Refund amount exceeds remaining balance`)
        const isFullyRefunded = newRefundedTotal === paymentAmount

        const paymentStatus = isFullyRefunded ? 'REFUNDED' : payment.paymentStatus
        // Create Refund Record
        const generateRefund = await trx.refund.create({
            data : {
                paymentId : paymentId,
                amount : amount,
                status : 'PENDING',
                reason : reason,
                updatedBy: "DEV-200",
            }
        })
        // update refunded amount on payment
        const updatePaymentWithRefundAmount = await trx.payment.update({
            where: {id : paymentId },
            data: {
                refundedAmount : newRefundedTotal,
                paymentStatus : paymentStatus
            }
        })

        return {generateRefund, updatePaymentWithRefundAmount}

    })
}


export async function createDispute(paymentId : string, reason : string, raisedBy : RaisedBy ) : Promise<{dispute : Dispute, payment: Payment}> {
    return await prisma.$transaction(async (trx ) => {
       const payment = await trx.payment.findUnique({
            where: {id: paymentId},
            select: {
                id: true,
                amount: true,
                currency: true,
                paymentStatus: true,
                paymentMethod: true,
                referenceCode: true,
                refundedAmount: true,
            }
        });

       if(!payment) throw new Error(`Payment ${paymentId} not found`)
        if(payment.paymentStatus !== "COMPLETED") {throw  new Error(`${payment.paymentStatus} Cannot refund a non-completed payment`) }

        // Check there is any existing disputes in the payment
        const existingDispute =
            await trx.dispute.findUnique({where: {paymentId },})
        if (existingDispute)
            throw new Error(`Dispute already exists for payment ${paymentId}`)

        const generateDisputeRecord =  await trx.dispute.create({
            data : {
                paymentId : paymentId,
                raisedBy : raisedBy,
                reason : reason,
            }
        })

        const updatePaymentRecord = await trx.payment.update({
            where: {id : paymentId },
            data : {
                paymentStatus: 'DISPUTED',
            }
        })

        return {dispute : generateDisputeRecord, payment: updatePaymentRecord}
        })
}


export async function createPayment(merchantId : string,
                                    customerId : string,
                                    amount :number,
                                    currency  : Currency ,
                                    referenceCode : string,
                                    paymentMethod : PaymentMethod,) : Promise<{createdPaymentRecord : Payment, transactionBreakDown : TransactionBreakdown}>{
    return await prisma.$transaction(async (trx ) => {
        const merchant = await trx.merchant.findUnique({
            where : {id : merchantId}
        })
        if(!merchant) throw new Error(`Merchant ${merchantId} not found`);
        if(merchant.status !== 'ACTIVE') {throw new Error("Payment Can't be Processed,  Merchant is inactive") }
        const tierID  = merchant.currentTierId;
        if(!tierID) throw new Error(`tier ${tierID} not found`);
        const currentTier  = await trx.feeSchedule.findUnique({where : {id : tierID}});
        if(!currentTier) throw new Error(`currentTier is not found`);
        const feeRate = Number(currentTier.feeRate);

        const feeAmount = amount * feeRate;
        const netAmount = amount - feeAmount;
        // --- This is where we check if payment Option is available check with Payment Processor
        const createdPaymentRecord = await trx.payment.create({
            data: {merchantId : merchantId,  customerId : customerId, amount : amount, currency  : currency, paymentMethod : paymentMethod,
                paymentStatus : 'COMPLETED', referenceCode : referenceCode
            }
        })
        // Create Transactional BreakDown

        const transactionBreakDown = await trx.transactionBreakdown.create({
            data : {paymentId : createdPaymentRecord.id, feeScheduleId : tierID, feeRate,  feeAmount, netAmount}
        })

        return {createdPaymentRecord, transactionBreakDown}
    })
}





export async function getPaymentsByCustomer(paymentId : string, reason :string) {}







