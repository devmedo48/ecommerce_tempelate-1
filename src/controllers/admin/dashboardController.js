import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

/**
 * @desc Get main dashboard statistics
 * @route GET /api/v1/admin/dashboard
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Parallel fetch all stats
  const [
    totalOrders,
    totalRevenueData,
    totalCustomers,
    totalProducts,
    ordersByStatus,
    recentOrders,
    topSellingItems,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Fetch product details for top items
  const topProducts = await Promise.all(
    topSellingItems.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, price: true, images: true },
      });
      return {
        ...product,
        sold: item._sum.quantity,
      };
    })
  );

  // Format orders by status
  const statusCounts = ordersByStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalOrders,
        totalRevenue: totalRevenueData._sum.totalAmount || 0,
        totalCustomers,
        totalProducts,
      },
      ordersByStatus: statusCounts,
      recentOrders,
      topProducts,
    },
  });
});
