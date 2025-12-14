/**
 * Admin Customer Controller
 * View and manage customers
 */

import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";

/**
 * @desc Get all customers with pagination
 * @route GET /api/admin/customers
 * @access Admin
 */
export const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;

  const where = {
    role: "CUSTOMER",
  };

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: customers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc Get single customer with details
 * @route GET /api/admin/customers/:id
 * @access Admin
 */
export const getCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      createdAt: true,
      addresses: {
        orderBy: { isDefault: "desc" },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
        },
      },
      _count: {
        select: { orders: true, reviews: true },
      },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  // Get total spent
  const totalSpent = await prisma.order.aggregate({
    where: { customerId: id, paymentStatus: "PAID" },
    _sum: { totalAmount: true },
  });

  res.json({
    success: true,
    data: {
      ...customer,
      totalSpent: totalSpent._sum.totalAmount || 0,
    },
  });
});

/**
 * @desc Update customer status
 * @route PUT /api/admin/customers/:id
 * @access Admin
 */
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const existing = await prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
  });

  if (!existing) {
    throw new AppError("Customer not found", 404);
  }

  const customer = await prisma.user.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  res.json({
    success: true,
    message: "Customer updated successfully",
    data: customer,
  });
});

export default {
  getCustomers,
  getCustomer,
  updateCustomer,
};
