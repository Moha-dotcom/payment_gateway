import {Response, Request} from "express";
import {createSettlementSchema} from "./settlements.schemas";
import z from "zod";
import {runSettlement} from "./settlements.services";


export async function handleSettlement(request: Request, response: Response) {
    try {
        const schemaResult  =createSettlementSchema.safeParse(request.body);
        if(!schemaResult.success){
            return response.status(400).json({ errors: schemaResult.error.message })
        }
        const startPeriod = new Date(schemaResult.data.periodStart);
        const endPeriod = new Date(schemaResult.data.periodEnd);
        if(endPeriod < startPeriod)
            return response.status(400).json({ errors: schemaResult.data.periodStart });
        const result = await runSettlement(schemaResult.data.merchantId, startPeriod, endPeriod);

        return response.status(200).json({
            data : result
        })

    }catch(err : any){
        if (err.code === 'P2002') {
            return response.status(409).json({ error: 'One or more payments have already been settled' })
        }
        return response.status(400).json({ error: err.message })
    }
}
