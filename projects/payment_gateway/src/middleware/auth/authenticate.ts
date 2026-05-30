import {NextFunction, Request, Response} from "express"
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";



export function  authenticate(req : Request, res : Response, next: NextFunction) {
        const authHeader  = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error : "No token provided",
            })
        }
        const token = authHeader.slice(7);
        try {
            req.user = jwt.verify(token, JWT_SECRET) as { userId: number, role: string };
            next()
        } catch {
            return res.status(401).json({ error: 'Invalid or expired token' })
        }
}
