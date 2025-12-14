/**
 * Webhook Routes
 * Handles external webhook endpoints (e.g., payment providers)
 */

import { Router } from "express";
import { handleMoyasarWebhook } from "../controllers/webhookController.js";

const router = Router();

/**
 * @route POST /api/webhooks/moyasar
 * @desc Handle Moyasar payment webhook events
 * @access Public (verified by signature)
 */
router.post("/moyasar", handleMoyasarWebhook);

export default router;
