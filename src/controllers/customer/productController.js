import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";
import { calculateDiscountedPrice } from "../../utils/offerUtils.js";

/**
 * @desc Get all products (Customer) with Offers
 * @route GET /api/v1/customer/products
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.validatedData || req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { isActive: true };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        offer: true,
        category: { select: { id: true, name: true } },
        modifiers: {
          include: { options: true },
        },
      },
      take: Number(limit),
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  // Calculate final price for each product using utility
  const productsWithPrice = products.map((product) => ({
    ...product,
    ...calculateDiscountedPrice(product),
  }));

  res.status(200).json({
    success: true,
    data: productsWithPrice,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc Get single product details
 * @route GET /api/v1/customer/products/:id
 */
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      offer: true,
      category: { select: { id: true, name: true } },
      modifiers: {
        include: { options: true },
      },
      reviews: {
        include: { user: { select: { firstName: true, lastName: true } } },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  // Calculate discounted price using utility
  const priceInfo = calculateDiscountedPrice(product);

  // Calculate average rating
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : null;

  res.status(200).json({
    success: true,
    data: {
      ...product,
      ...priceInfo,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    },
  });
});
