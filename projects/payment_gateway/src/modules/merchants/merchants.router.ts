import express from "express";
import {handleGetMerchantPayment, handlePatchMerchantPayment} from "./merchants.controller";
const router = express.Router();

router.get("/:id/payments", handleGetMerchantPayment)
router.patch('/:id/payments/status',handlePatchMerchantPayment )
export default router;