import * as z from "zod";

export const createPaymentSchema = z.object({
    merchantId : z.string().uuid(),
    customerId : z.string().uuid(),
    amount : z.number().positive(),
    currency : z.enum(['USD' , 'KES', 'SOM']),
    referenceCode : z.string().uuid(),
    paymentMethod : z.enum(['VISA', 'ACH'])
})
export const createRefundSchema = z.object({
    amount : z.number().positive(),
    reason : z.string().min(10).max(200)
})

export const createDisputeSchema = z.object({
    reason : z.string(),
    raisedBy : z.enum(['CUSTOMER', 'MERCHANT'])
})


