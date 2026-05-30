import express from 'express'
import {getAllPayments, createPayment} from "./payment.services";
import {handlePaymentList, handleCreatePayment, handleProcessRefund, handleCreateDispute} from "./payment.controller";

import rateLimit from "express-rate-limit";


const paymentRateLimiter = rateLimit({
    windowMs: 15 * 60  *1000,
    limit : 5,
    message : {error : "too many payment rate limit"},
    standardHeaders : "draft-7",
    legacyHeaders : false
})

const router = express.Router()
router.use(paymentRateLimiter)

// MerchantId, customerId, amount, currency, referenceCode, PaymentMethod
router.get('/', handlePaymentList);
router.post('/', handleCreatePayment)
router.post('/:id/disputes', handleCreateDispute)
router.post('/:id/refunds', handleProcessRefund)
router.get('/:id', async (req, res) => {
    if(!req.params.id){ throw new Error('Merchant id is required')}
    const data = await getAllPayments(String(req.params.id))
    return res.status(200).json(data)
})


export default router