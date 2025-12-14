/**
 * Moyasar Webhook Controller
 * Handles async payment notifications from Moyasar
 * Docs: https://docs.moyasar.com/
 */

import crypto from "crypto";
import prisma from "../config/database.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const WEBHOOK_SECRET = process.env.MOYASAR_WEBHOOK_SECRET;

/**
 * Verify Moyasar webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from header
 * @returns {boolean}
 */
function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn(
      "MOYASAR_WEBHOOK_SECRET not configured, skipping verification"
    );
    return true; // Allow in development if not configured
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Find order by payment ID
 */
async function findOrderByPaymentId(paymentId) {
  return prisma.order.findFirst({
    where: { paymentId },
    select: {
      id: true,
      paymentStatus: true,
      status: true,
      paymentId: true,
    },
  });
}

/**
 * Handle payment_paid event
 */
async function handlePaymentPaid(payment) {
  const order = await findOrderByPaymentId(payment.id);

  if (!order) {
    console.log(`Webhook: No order found for payment ${payment.id}`);
    return;
  }

  if (order.paymentStatus === "PAID") {
    console.log(`Webhook: Order already paid for payment ${payment.id}`);
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
    },
  });

  console.log(`Webhook: Order ${order.id} marked as PAID`);
}

/**
 * Handle payment_failed event
 */
async function handlePaymentFailed(payment) {
  const order = await findOrderByPaymentId(payment.id);

  if (!order) {
    console.log(`Webhook: No order found for payment ${payment.id}`);
    return;
  }

  if (order.paymentStatus === "FAILED") {
    console.log(`Webhook: Order already failed for payment ${payment.id}`);
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "FAILED",
    },
  });

  console.log(`Webhook: Order ${order.id} marked as FAILED`);
}

/**
 * Handle payment_refunded event
 */
async function handlePaymentRefunded(payment) {
  const order = await findOrderByPaymentId(payment.id);

  if (!order) {
    console.log(`Webhook: No order found for payment ${payment.id}`);
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "REFUNDED",
    },
  });

  console.log(`Webhook: Order ${order.id} marked as REFUNDED`);
}

/**
 * @desc Handle Moyasar webhook events
 * @route POST /api/webhooks/moyasar
 * @access Public (verified by signature)
 */
export const handleMoyasarWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-moyasar-signature"];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  // Verify signature
  if (!verifySignature(rawBody, signature)) {
    console.warn("Webhook: Invalid signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Return 200 immediately to acknowledge receipt
  res.status(200).json({ received: true });

  // Process webhook asynchronously
  const { type, data } = req.body;

  console.log(`Webhook received: ${type}`, data?.id);

  try {
    switch (type) {
      case "payment_paid":
        await handlePaymentPaid(data);
        break;

      case "payment_failed":
        await handlePaymentFailed(data);
        break;

      case "payment_refunded":
        await handlePaymentRefunded(data);
        break;

      case "payment_voided":
        await handlePaymentFailed(data); // Treat voided as failed
        break;

      case "payment_authorized":
      case "payment_captured":
      case "payment_verified":
        // These are informational, payment_paid handles the final state
        console.log(`Webhook: Received ${type} event, no action needed`);
        break;

      default:
        console.log(`Webhook: Unknown event type: ${type}`);
    }
  } catch (error) {
    // Log error but don't fail - we already sent 200
    console.error(`Webhook processing error for ${type}:`, error);
  }
});

export default {
  handleMoyasarWebhook,
};
