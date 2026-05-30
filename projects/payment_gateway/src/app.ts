import 'dotenv/config'
import express from 'express'
import paymentRouter from "./modules/payments/payment.router";
import disputeRouter from "./modules/disputes/dispute.router";
import settlementsRouter from "./modules/settlements/settlements.router";
import merchantsRouter from "./modules/merchants/merchants.router";
import {authenticate} from "./middleware/auth/authenticate";
import cors from "cors";
import helmet from 'helmet'
import rateLimit from "express-rate-limit";

import jwt from "jsonwebtoken";
const app = express();


app.use(helmet());
app.use(cors({
    origin: ['http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true
}))


const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { error: 'Too many requests, try again later' }
})
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit : 10,
    message : {error : "try again to many request"}
})
app.use(globalLimiter)



app.use(express.json());






app.post("/v1/auth/token",  authLimiter,   (req, res) => {
    const token = jwt.sign(
        { userId: 1, role: 'admin' },
        process.env.JWT_SECRET ?? 'dev-secret',
        { expiresIn: '1h' }
    )
    return res.json({ token })
})


app.use(authenticate)


app.use('/payments', paymentRouter )
app.use('/disputes', disputeRouter)
app.use('/settlements', settlementsRouter)
app.use('/merchants', merchantsRouter)




app.listen((4000), () => {
    console.log(`Listening on port ${4000}`);
});




