import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Get all orders (Admin) with filtering
 * @route GET /api/v1/admin/orders
 */
export const getOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    search,
  } = req.validatedData?.query || req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      {
        customer: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        _count: { select: { items: true } },
      },
      take: Number(limit),
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc Get single order details
 * @route GET /api/v1/admin/orders/:id
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true, price: true },
          },
        },
      },
      coupon: {
        select: { code: true, type: true, value: true },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.status(200).json({ success: true, data: order });
});

/**
 * @desc Update order status
 * @route PUT /api/v1/admin/orders/:id/status
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const { status } = req.validatedData?.body || req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Handle coupon restoration if cancelling
  if (
    status === "CANCELLED" &&
    order.status !== "CANCELLED" &&
    order.couponId
  ) {
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status },
      }),
      prisma.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { decrement: 1 } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { ...order, status },
      message: "Order cancelled and coupon restored",
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status },
  });

  res.status(200).json({ success: true, data: updatedOrder });
});
