import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Create a review for a product
 * @route POST /api/v1/customer/reviews
 */
export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.validatedData?.body || req.body;
  const userId = req.user.id;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  // Check for duplicate review (also enforced by unique constraint)
  const existingReview = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existingReview) {
    throw new AppError("You have already reviewed this product", 400);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment,
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  res.status(201).json({ success: true, data: review });
});

/**
 * @desc Update a review
 * @route PUT /api/v1/customer/reviews/:id
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const data = req.validatedData?.body || req.body;
  const userId = req.user.id;

  // Check ownership
  const existing = await prisma.review.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError("Review not found", 404);
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc Delete a review
 * @route DELETE /api/v1/customer/reviews/:id
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const userId = req.user.id;

  const existing = await prisma.review.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError("Review not found", 404);
  }

  await prisma.review.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Review deleted" });
});

/**
 * @desc Get my reviews
 * @route GET /api/v1/customer/reviews/me
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.validatedData?.query || req.query;
  const userId = req.user.id;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, images: true },
        },
      },
      take: Number(limit),
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { userId } }),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc Get reviews for a product
 * @route GET /api/v1/customer/reviews/product/:productId
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.validatedData?.params || req.params;
  const { page = 1, limit = 10 } = req.validatedData?.query || req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total, stats] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      take: Number(limit),
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    stats: {
      avgRating: stats._avg.rating
        ? Math.round(stats._avg.rating * 10) / 10
        : null,
      totalReviews: stats._count,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});
