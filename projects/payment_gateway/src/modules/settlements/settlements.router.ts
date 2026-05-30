import {handleSettlement} from "./settlements.controller";
import express from "express";
const router = express.Router();



router.post("/run", handleSettlement);
export default router;