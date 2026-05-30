import express from 'express';
import {handleResolveDispute} from "./dispute.controller";

const router = express.Router();

router.patch('/:id/resolve', handleResolveDispute)

export default router;