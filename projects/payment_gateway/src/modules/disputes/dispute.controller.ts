
import {Response, Request, NextFunction} from "express";
import {createResolveDisputeSchema} from "./dispute.schemas";

import {createDispute} from "../payments/payment.services";
import {resolveDispute} from "./disputes.services";
export async function handleResolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
        const disputeId = req.params.id as string
        const result =  createResolveDisputeSchema.safeParse(req.body);
        if(!disputeId)  return res.status(400).json({ error: 'Payment ID is required' })
        if(!result.success)   return res.status(400).json({ errors: result.error.flatten() })
        const response = await resolveDispute(disputeId,
            result.data.disputeOutCome, result.data.reason, result.data.updatedBy, result.data.resolvedBy);
        return res.status(201).json({
            data  : response,
        })
    }catch (error : any) {
        res.status(500).json({error: error.message});
    }

}
