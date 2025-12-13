import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler.js";
import prisma from "../../config/database.js";
import { verifyPayment } from "../../services/paymentService.js";
import AppError from "../../utils/appError.js";

const router = Router();

/**
 * @desc Payment callback - called by Moyasar after payment completion
 * @route GET /api/v1/customer/payments/callback
 */
router.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const { id: paymentId } = req.query;

    if (!paymentId) {
      throw new AppError("Payment ID is required", 400);
    }

    // Find order by payment ID
    const order = await prisma.order.findFirst({
      where: { paymentId },
    });

    if (!order) {
      throw new AppError("Order not found for this payment", 404);
    }

    // If payment is already processed, redirect to success/failure page
    if (order.paymentStatus === "PAID") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/orders/${order.id}?status=success`
      );
    }

    if (order.paymentStatus === "FAILED") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/orders/${order.id}?status=failed`
      );
    }

    // Verify payment with Moyasar
    const verification = await verifyPayment(
      paymentId,
      order.totalAmountInSmallestUnit,
      "SAR"
    );

    if (verification.verified) {
      // Update order as paid
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/orders/${order.id}?status=success`
      );
    } else {
      // Update order as failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
        },
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/orders/${
          order.id
        }?status=failed&reason=${encodeURIComponent(
          verification.error || "Payment verification failed"
        )}`
      );
    }
  })
);

/**
 * @desc Check payment status - for polling from frontend
 * @route GET /api/v1/customer/payments/:orderId/status
 */
router.get(
  "/:orderId/status",
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user?.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentStatus: true,
        status: true,
        customerId: true,
        paymentId: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Only allow owner to check status
    if (userId && order.customerId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // If still pending, try to verify with Moyasar
    if (order.paymentStatus === "PENDING" && order.paymentId) {
      const verification = await verifyPayment(order.paymentId);

      if (verification.verified) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
          },
        });

        return res.json({
          success: true,
          data: {
            paymentStatus: "PAID",
            orderStatus: "CONFIRMED",
          },
        });
      } else if (verification.status === "failed") {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED" },
        });

        return res.json({
          success: true,
          data: {
            paymentStatus: "FAILED",
            orderStatus: order.status,
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
      },
    });
  })
);

export default router;
