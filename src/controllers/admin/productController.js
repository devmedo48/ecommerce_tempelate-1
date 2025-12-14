import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import {
  processAndSaveImage,
  deleteImage,
} from "../../services/imageService.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Get all products (Admin)
 * @route GET /api/v1/admin/products
 */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    isActive,
  } = req.validatedData?.query || req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        modifiers: { include: { options: true } },
        offer: { select: { id: true, name: true, type: true, value: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { reviews: true, orderItems: true } },
      },
      take: Number(limit),
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc Get single product (Admin)
 * @route GET /api/v1/admin/products/:id
 */
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      modifiers: { include: { options: true } },
      offer: true,
      category: true,
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      _count: { select: { reviews: true, orderItems: true } },
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({ success: true, data: product });
});

/**
 * @desc Create a new product with images and modifiers
 * @route POST /api/v1/admin/products
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, modifiers, categoryId } = req.body;
  const files = req.files;

  // Process Images
  const processedImages = [];
  if (files?.length > 0) {
    for (const file of files) {
      const path = await processAndSaveImage(file.path);
      processedImages.push(path);
    }
  }

  // Parse Modifiers (from form-data)
  let parsedModifiers = [];
  if (modifiers) {
    try {
      parsedModifiers =
        typeof modifiers === "string" ? JSON.parse(modifiers) : modifiers;
    } catch {
      throw new AppError("Invalid modifiers format", 400);
    }
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      images: processedImages,
      ...(categoryId && { categoryId }),
      modifiers: {
        create: parsedModifiers.map((mod) => ({
          name: mod.name,
          isRequired: mod.isRequired || false,
          multiSelect: mod.multiSelect || false,
          options: {
            create: mod.options.map((opt) => ({
              name: opt.name,
              price: parseFloat(opt.price || 0),
            })),
          },
        })),
      },
    },
    include: {
      modifiers: { include: { options: true } },
      category: true,
    },
  });

  res.status(201).json({ success: true, data: product });
});

/**
 * @desc Update a product
 * @route PUT /api/v1/admin/products/:id
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;
  const data = req.validatedData?.body || req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = parseFloat(data.price);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.categoryId !== undefined)
    updateData.categoryId = data.categoryId || null;

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      modifiers: { include: { options: true } },
      category: true,
    },
  });

  res.status(200).json({ success: true, data: product });
});

/**
 * @desc Delete a product
 * @route DELETE /api/v1/admin/products/:id
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.validatedData?.params || req.params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Delete images from filesystem
  if (product.images?.length > 0) {
    for (const img of product.images) {
      await deleteImage(img);
    }
  }

  await prisma.product.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Product deleted" });
});
