import {createDispute, createPayment, getAllPayments, processRefund} from "./payment.services";
import {Response, Request} from "express";
import {createDisputeSchema, createPaymentSchema, createRefundSchema} from "./payment.schemas";

export async function handleCreatePayment(req: Request, res: Response) {
    try {
        const result = createPaymentSchema.safeParse(req.body);
        if(!result.success)   return res.status(400).json({ errors: result.error.flatten() })
        const response = await  createPayment(result.data.merchantId, result.data.customerId,result.data.amount,
            result.data.currency,  result.data.referenceCode,  result.data.paymentMethod)

        return res.status(201).json({
            data  : response,
        })
    }catch(err : any){
        res.status(400).json({
            error : err.message,
        })
    }

}

export async function handleProcessRefund(req: Request, res: Response) {
    try {
        const paymentId   =  req.params.id as string
        const result = createRefundSchema.safeParse(req.body);
        if(!paymentId)  return res.status(400).json({ error: 'Payment ID is required' })
        if(!result.success)   return res.status(400).json({ errors: result.error.flatten() })
        const response = await processRefund(paymentId,
            result.data.amount, result.data.reason)
        return res.status(201).json({
            data  : response,
        })

    }catch(err : any){
        res.status(400).json({
            error: err.message,
        })
    }
}

export async function handleCreateDispute(req: Request, res: Response) {
 try{
     const paymentId   =  req.params.id as string
     const result = createDisputeSchema.safeParse(req.body);
     if(!paymentId)  return res.status(400).json({ error: 'Payment ID is required' })
     if(!result.success)   return res.status(400).json({ errors: result.error.flatten() })
     const response = await createDispute(paymentId,
         result.data.reason, result.data.raisedBy)
     return res.status(201).json({
         data  : response,
     })
 }catch(err : any){
     res.status(400).json({
         error: err.message,
     })
 }
}


export async function handlePaymentList(req: Request, res: Response) {
    try{
        const merchantId =  req.params.id as string
        const data = await getAllPayments(merchantId)
        return res.status(200).json({
            data : data
        })
    }catch(err : any){
    }
}

