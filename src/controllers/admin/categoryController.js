/**
 * Admin Category Controller
 * CRUD operations for category management
 */

import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Get all categories
 * @route GET /api/admin/categories
 * @access Admin
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query;

  const where = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        _count: { select: { products: true } },
      },
    }),
    prisma.category.count({ where }),
  ]);

  res.json({
    success: true,
    data: categories,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc Get single category
 * @route GET /api/admin/categories/:id
 * @access Admin
 */
export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.json({
    success: true,
    data: category,
  });
});

/**
 * @desc Create category
 * @route POST /api/admin/categories
 * @access Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, isActive } = req.validatedData || req.body;

  // Check if name already exists
  const existing = await prisma.category.findUnique({
    where: { name },
  });

  if (existing) {
    throw new AppError("Category name already exists", 400);
  }

  const category = await prisma.category.create({
    data: {
      name,
      description,
      image,
      isActive: isActive !== false,
    },
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

/**
 * @desc Update category
 * @route PUT /api/admin/categories/:id
 * @access Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image, isActive } = req.validatedData || req.body;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Category not found", 404);
  }

  // If changing name, check uniqueness
  if (name && name !== existing.name) {
    const duplicate = await prisma.category.findUnique({ where: { name } });
    if (duplicate) {
      throw new AppError("Category name already exists", 400);
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

/**
 * @desc Delete category
 * @route DELETE /api/admin/categories/:id
 * @access Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!existing) {
    throw new AppError("Category not found", 404);
  }

  // Unlink products first (set categoryId to null)
  if (existing._count.products > 0) {
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
  }

  await prisma.category.delete({ where: { id } });

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
});

export default {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
