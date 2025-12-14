/**
 * Admin Coupon Controller
 * CRUD operations for coupon management
 */

import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Get all coupons with pagination
 * @route GET /api/admin/coupons
 * @access Admin
 */
export const getCoupons = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive,
  } = req.validatedData || req.query;

  const where = {};

  if (search) {
    where.code = { contains: search, mode: "insensitive" };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        _count: { select: { orders: true } },
      },
    }),
    prisma.coupon.count({ where }),
  ]);

  res.json({
    success: true,
    data: coupons,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc Get single coupon
 * @route GET /api/admin/coupons/:id
 * @access Admin
 */
export const getCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      _count: { select: { orders: true } },
    },
  });

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  res.json({
    success: true,
    data: coupon,
  });
});

/**
 * @desc Create coupon
 * @route POST /api/admin/coupons
 * @access Admin
 */
export const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minPurchase, limit, expireAt, isActive } =
    req.validatedData || req.body;

  // Check if code already exists
  const existing = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (existing) {
    throw new AppError("Coupon code already exists", 400);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type,
      value,
      minPurchase: minPurchase || 0,
      limit: limit || null,
      expireAt: new Date(expireAt),
      isActive: isActive !== false,
    },
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    data: coupon,
  });
});

/**
 * @desc Update coupon
 * @route PUT /api/admin/coupons/:id
 * @access Admin
 */
export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code, type, value, minPurchase, limit, expireAt, isActive } =
    req.validatedData || req.body;

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Coupon not found", 404);
  }

  // If changing code, check uniqueness
  if (code && code.toUpperCase() !== existing.code) {
    const duplicate = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (duplicate) {
      throw new AppError("Coupon code already exists", 400);
    }
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(code && { code: code.toUpperCase() }),
      ...(type && { type }),
      ...(value !== undefined && { value }),
      ...(minPurchase !== undefined && { minPurchase }),
      ...(limit !== undefined && { limit }),
      ...(expireAt && { expireAt: new Date(expireAt) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({
    success: true,
    message: "Coupon updated successfully",
    data: coupon,
  });
});

/**
 * @desc Delete coupon
 * @route DELETE /api/admin/coupons/:id
 * @access Admin
 */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Coupon not found", 404);
  }

  await prisma.coupon.delete({ where: { id } });

  res.json({
    success: true,
    message: "Coupon deleted successfully",
  });
});

export default {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
