import zod from "zod"
import {PaymentStatus} from "@prisma/client";

export const handlePatchMerchantPaymentSchema = zod.object({
    status : zod.nativeEnum(PaymentStatus),
})