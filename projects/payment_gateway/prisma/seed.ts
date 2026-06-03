
import prisma from '../src/config/db.js'
import { randomUUID } from 'node:crypto'

export async function seed() {
    return prisma.$transaction(async (trx : any) => {

        // 1. Fee tiers
        const basicTier = await trx.feeSchedule.create({
            data: {
                tier: "BASIC",
                volumeMin: 1,
                volumeMax: 10000,
                feeRate: 0.032,
            },
        });

        const growthTier = await trx.feeSchedule.create({
            data: {
                tier: "GROWTH",
                volumeMin: 10001,
                volumeMax: 100000,
                feeRate: 0.0213,
            },
        });

        // 2. Merchants (you NEED IDs → use create)
        const merchant1 = await trx.merchant.create({
            data: {
                businessName: "5PM Coffee Shop",
                businessAddress: "Brooklyn Park MN",
                phoneNumber: "824-293-3894",
                email: "fivePmCoffee@gmail.com",
                password: "123456",
                annualRevenue: 92984,
                status: "ACTIVE",
                currency: "USD",
                currentTierId: basicTier.id,
            },
        });

        const merchant2 = await trx.merchant.create({
            data: {
                businessName: "Amal Beauty Shop",
                businessAddress: "Brooklyn Park MN",
                phoneNumber: "824-293-1234",
                email: "amal@gmail.com",
                password: "024049295",
                annualRevenue: 12000,
                status: "ACTIVE",
                currency: "USD",
                currentTierId: growthTier.id,
            },
        });

        // 3. Customers (same rule)
        const customer1 = await trx.customer.create({
            data: {
                name: "Mohamed Sahal",
                email: "mohamed@gmail.com",
                phoneNumber: "827-394-4824",
            },
        });

        const customer2 = await trx.customer.create({
            data: {
                name: "Hamdi Ismail",
                email: "hamdi@gmail.com",
                phoneNumber: "612-394-4824",
            },
        });

        const customer3 = await trx.customer.create({
            data: {
                name: "Peter Linch",
                email: "peter@gmail.com",
                phoneNumber: "763-394-4824",
            },
        });

        // 4. Payments
        const payment1 = await  trx.payment.create({
            data: {
                merchantId: merchant1.id,
                customerId: customer1.id,
                amount: 1200,
                currency: "USD",
                paymentStatus: "COMPLETED",
                paymentMethod: "ACH",
                referenceCode: randomUUID(),
            },
        });

        const payment2 = await trx.payment.create({
            data: {
                merchantId: merchant2.id,
                customerId: customer2.id,
                amount: 90,
                currency: "USD",
                paymentStatus: "COMPLETED",
                paymentMethod: "ACH",
                referenceCode: randomUUID(),
            },
        });

        // 5. Breakdown (correct math)
        const feeAmount = Number((Number(basicTier.feeRate) * Number(payment1.amount)).toFixed(4))
        const netAmount = Number(payment1.amount) - feeAmount

        await trx.transactionBreakdown.create({
            data: {
                paymentId: payment1.id,
                feeScheduleId: basicTier.id,
                feeRate: basicTier.feeRate,
                feeAmount,
                netAmount: netAmount
            },
        });

        // 6. Refund + dispute
        await trx.refund.create({
            data: {
                paymentId: payment1.id,
                amount: 200,
                status: "PENDING",
                reason: "customer raised dispute",
                updatedBy: "DEV-200",
            },
        });

        await trx.dispute.create({
            data: {
                paymentId: payment1.id,
                raisedBy: "CUSTOMER",
                reason: "Item has a defect",

            },
        });

        // 10. settlement
        const settlement = await trx.settlement.create({
            data: {
                merchantId: merchant1.id,
                settlementAmount: 1161.60,
                status: "PENDING",
                periodStart: new Date("2026-04-01"),
                periodEnd: new Date("2026-04-30"),
                settledBy: "SYSTEM",
            },
        });

// 11. settlementPayments
        await trx.settlementPayment.create({
            data: {
                paymentId: payment1.id,
                settlementId: settlement.id,
            },
        });

// 12. settlementBreakdown
        await trx.settlementBreakdown.create({
            data: {
                settlementId: settlement.id,
                grossAmount: payment1.amount,
                feeDeduction: feeAmount,
                disputesHeld: 0,
                netAmount: payment1.amount - feeAmount,
            },
        });

    });
}

seed().then((result) => {
    console.log(result)
})
