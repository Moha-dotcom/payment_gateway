
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import process from "node:process";

const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate())

export default prisma
