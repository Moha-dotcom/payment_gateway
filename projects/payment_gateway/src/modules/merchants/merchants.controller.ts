import {Request, Response} from "express";
import {getPaymentsByMerchant, updatePaymentStatus} from "./merchants.services";
import {handlePatchMerchantPaymentSchema} from "./merchants.schemas.js";



export async function handleGetMerchantPayment(req: Request, res: Response) {
    try {
        const {status, cursor} = req.query;
        const merchantId = req.params.id as string
        if(!merchantId) return res.status(400).json({ error: 'Merchant id is required' })
        const data = await getPaymentsByMerchant(merchantId, status as string, cursor as string);
        return res.status(200).json({
            data : data
        })
    }catch(err : any){
        return res.status(400).json({
            error: err.message
        })
    }
}

export async function handlePatchMerchantPayment(req: Request, res: Response) {
    try {
        const merchantId = req.params.id as string
        const result  = handlePatchMerchantPaymentSchema.safeParse(req.body);
        if(!result.success) return res.status(400).json({ errors: result.error.flatten() })
        const updatedPayment = await updatePaymentStatus(merchantId, result.data.status)
        return res.status(200).json({
            data : updatedPayment
        })
    }catch(err : any){
        return res.status(400).json({
            error: err.message
        })
    }
}