import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Create a new offer
 * @route POST /api/v1/admin/offers
 */
export const createOffer = asyncHandler(async (req, res) => {
  const data = req.validatedData?.body || req.body;

  const offer = await prisma.offer.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      scope: data.scope,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      products:
        data.scope === "PRODUCT" && data.productIds
          ? { connect: data.productIds.map((id) => ({ id })) }
          : undefined,
    },
    include: {
      _count: { select: { products: true } },
    },
  });

  res.status(201).json({ success: true, data: offer });
});

/**
 * @desc Get all offers
 * @route GET /api/v1/admin/offers
 */
export const getOffers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    scope,
    isActive,
  } = req.validatedData?.query || req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};
  if (scope) where.scope = scope;
  if (isActive !== undefined) {
    if (isActive === "true") {
      where.isActive = true;
      where.startDate = { lte: new Date() };
      where.endDate = { gte: new Date() };
    } else {
      where.isActive = false;
    }
  }

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      take: Number(limit),
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true } },
      },
    }),
    prisma.offer.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: offers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc Get single offer
 * @route GET /api/v1/admin/offers/:id
 */
export const getOffer = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, price: true, images: true },
      },
    },
  });

  if (!offer) {
    throw new AppError("Offer not found", 404);
  }

  res.status(200).json({ success: true, data: offer });
});

/**
 * @desc Update an offer
 * @route PUT /api/v1/admin/offers/:id
 */
export const updateOffer = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const data = req.validatedData?.body || req.body;

  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Offer not found", 404);
  }

  // Build update data
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.startDate !== undefined)
    updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // Handle product IDs update (replace entire list)
  if (data.productIds !== undefined) {
    // First disconnect all existing products
    await prisma.product.updateMany({
      where: { offerId: id },
      data: { offerId: null },
    });

    // Then connect new products
    if (data.productIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: data.productIds } },
        data: { offerId: id },
      });
    }
  }

  const updated = await prisma.offer.update({
    where: { id },
    data: updateData,
    include: {
      _count: { select: { products: true } },
    },
  });

  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc Delete offer
 * @route DELETE /api/v1/admin/offers/:id
 */
export const deleteOffer = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;

  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Offer not found", 404);
  }

  // Clear offer from products first
  await prisma.product.updateMany({
    where: { offerId: id },
    data: { offerId: null },
  });

  await prisma.offer.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Offer deleted" });
});
