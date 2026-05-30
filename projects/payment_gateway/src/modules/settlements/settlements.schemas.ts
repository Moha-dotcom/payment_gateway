import z  from 'zod';

export const createSettlementSchema = z.object({
    merchantId : z.string().uuid(),
    periodStart : z.string().date(),
    periodEnd : z.string().date()
})
