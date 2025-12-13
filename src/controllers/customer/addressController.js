import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Get all addresses for logged in user
 * @route GET /api/v1/customer/addresses
 */
export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { isDefault: "desc" },
  });

  res.status(200).json({ success: true, data: addresses });
});

/**
 * @desc Create a new address
 * @route POST /api/v1/customer/addresses
 */
export const createAddress = asyncHandler(async (req, res) => {
  const data = req.validatedData?.body || req.body;
  const userId = req.user.id;

  // If setting as default, unset other defaults in a transaction
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      ...data,
    },
  });

  res.status(201).json({ success: true, data: address });
});

/**
 * @desc Update an address
 * @route PUT /api/v1/customer/addresses/:id
 */
export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const data = req.validatedData?.body || req.body;
  const userId = req.user.id;

  // Check ownership
  const existing = await prisma.address.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError("Address not found", 404);
  }

  // Handle default address logic in transaction
  if (data.isDefault) {
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id },
        data,
      }),
    ]);

    const updated = await prisma.address.findUnique({ where: { id } });
    return res.status(200).json({ success: true, data: updated });
  }

  const updated = await prisma.address.update({
    where: { id },
    data,
  });

  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc Delete an address
 * @route DELETE /api/v1/customer/addresses/:id
 */
export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const userId = req.user.id;

  const existing = await prisma.address.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError("Address not found", 404);
  }

  await prisma.address.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Address deleted" });
});

/**
 * @desc Set address as default
 * @route PUT /api/v1/customer/addresses/default/:id
 */
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const userId = req.user.id;

  const existing = await prisma.address.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new AppError("Address not found", 404);
  }

  // Transaction to ensure atomicity
  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  res.status(200).json({ success: true, message: "Default address updated" });
});
