import 'dotenv/config'
import { defineConfig, env } from "prisma/config";
import process from "node:process";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        url: process.env.DATABASE_URL
    },
});
