import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";
import { isOfferActive, applyDiscount } from "../../utils/offerUtils.js";
import { toSmallestUnit } from "../../services/paymentService.js";

/**
 * @desc Place a new order
 * @route POST /api/v1/customer/orders
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const { items, couponCode, paymentMethod, addressId, newAddress } =
    req.validatedData?.body || req.body;
  const userId = req.user.id;

  // 1. Resolve Address
  let finalAddressSnapshot;

  if (addressId) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new AppError("Invalid address selected", 400);
    }
    finalAddressSnapshot = address;
  } else if (newAddress) {
    const savedAddress = await prisma.address.create({
      data: { userId, ...newAddress },
    });
    finalAddressSnapshot = savedAddress;
  }

  // 2. Calculate Totals & Validate Items
  let totalAmount = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        modifiers: { include: { options: true } },
        offer: true,
      },
    });

    if (!product || !product.isActive) {
      throw new AppError(
        `Product not found or inactive: ${item.productId}`,
        400
      );
    }

    // Calculate Base Price with Offer
    let unitPrice = Number(product.price);

    // Apply Product Offer if active
    if (product.offer && isOfferActive(product.offer)) {
      unitPrice = applyDiscount(unitPrice, product.offer);
    }

    const selectedModifiersSummary = [];

    // Calculate modifiers
    if (item.modifiers?.length > 0) {
      for (const reqMod of item.modifiers) {
        const modifier = product.modifiers.find(
          (m) => m.id === reqMod.modifierId
        );
        if (!modifier) continue;

        const option = modifier.options.find((o) => o.id === reqMod.optionId);
        if (option) {
          unitPrice += Number(option.price);
          selectedModifiersSummary.push({
            modifierName: modifier.name,
            optionName: option.name,
            price: Number(option.price),
          });
        }
      }
    }

    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    orderItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice: itemTotal,
      selectedModifiers: selectedModifiersSummary,
    });
  }

  // 3. Apply Global Offer (Store-wide sale)
  const globalOffer = await prisma.offer.findFirst({
    where: {
      scope: "GLOBAL",
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  let globalDiscount = 0;
  if (globalOffer) {
    if (globalOffer.type === "PERCENTAGE") {
      globalDiscount = totalAmount * (Number(globalOffer.value) / 100);
    } else {
      globalDiscount = Number(globalOffer.value);
    }
    globalDiscount = Math.min(globalDiscount, totalAmount);
  }

  // 4. Handle Coupon
  let couponDiscount = 0;
  let couponId = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) {
      throw new AppError("Invalid coupon code", 400);
    }

    if (!coupon.isActive || coupon.expireAt < new Date()) {
      throw new AppError("Coupon expired", 400);
    }

    if (coupon.limit && coupon.usedCount >= coupon.limit) {
      throw new AppError("Coupon usage limit reached", 400);
    }

    const taxableAmount = totalAmount - globalDiscount;

    if (coupon.minPurchase && taxableAmount < Number(coupon.minPurchase)) {
      throw new AppError(
        `Minimum purchase of ${coupon.minPurchase} required`,
        400
      );
    }

    if (coupon.type === "PERCENTAGE") {
      couponDiscount = taxableAmount * (Number(coupon.value) / 100);
    } else {
      couponDiscount = Number(coupon.value);
    }

    couponDiscount = Math.min(couponDiscount, taxableAmount);
    couponId = coupon.id;
  }

  const totalDiscount = globalDiscount + couponDiscount;
  const finalTotal = Math.max(0, totalAmount - totalDiscount);
  const amountInSmallestUnit = toSmallestUnit(finalTotal, "SAR");

  // 5. Create Order Transaction
  const order = await prisma.$transaction(async (tx) => {
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return tx.order.create({
      data: {
        customerId: userId,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
        status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
        totalAmount: finalTotal,
        totalAmountInSmallestUnit: amountInSmallestUnit,
        discountAmount: totalDiscount,
        couponId,
        shippingAddress: finalAddressSnapshot,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });
  });

  // 6. Handle Payment Method
  if (paymentMethod === "COD") {
    // COD - Order is confirmed immediately
    return res.status(201).json({
      success: true,
      data: order,
      message: "Order placed successfully. Pay on delivery.",
    });
  }

  // ONLINE Payment - Return order for frontend to show Moyasar Form
  // Frontend uses Moyasar JS library which handles card input securely
  return res.status(201).json({
    success: true,
    data: {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      totalAmountInSmallestUnit: order.totalAmountInSmallestUnit,
      paymentStatus: order.paymentStatus,
      status: order.status,
    },
    message: "Order created. Complete payment.",
  });
});

/**
 * @desc Get my orders
 * @route GET /api/v1/customer/orders
 */
export const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.validatedData?.query || req.query;
  const userId = req.user.id;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
          },
        },
      },
    }),
    prisma.order.count({ where: { customerId: userId } }),
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
 * @desc Get order details
 * @route GET /api/v1/customer/orders/:id
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      coupon: { select: { code: true, type: true, value: true } },
    },
  });

  if (!order || order.customerId !== userId) {
    throw new AppError("Order not found", 404);
  }

  res.status(200).json({ success: true, data: order });
});

/**
 * @desc Cancel an order (only if PENDING)
 * @route PUT /api/v1/customer/orders/:id/cancel
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { coupon: true },
  });

  if (!order || order.customerId !== userId) {
    throw new AppError("Order not found", 404);
  }

  // Only allow cancellation of PENDING orders
  if (order.status !== "PENDING") {
    throw new AppError(
      `Cannot cancel order with status: ${order.status}. Only PENDING orders can be cancelled.`,
      400
    );
  }

  // Cancel order and restore coupon usage if applicable
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Restore coupon usage count
    if (order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  });

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
  });
});
