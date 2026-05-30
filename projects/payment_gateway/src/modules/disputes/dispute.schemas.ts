import * as z from "zod";


export const createResolveDisputeSchema = z.object({
    disputeOutCome : z.enum(['REJECTED', 'RESOLVED']),
    reason : z.string(),
    updatedBy :z.string(),
    resolvedBy: z.string().optional()
})