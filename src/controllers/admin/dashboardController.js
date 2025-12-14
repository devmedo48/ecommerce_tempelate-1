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

/**
 * @desc Get analytics data with time-series for charts
 * @route GET /api/v1/admin/dashboard/analytics
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const { period = "30" } = req.query;
  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get orders for the period
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { not: "CANCELLED" },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      paymentStatus: true,
    },
  });

  // Get new customers for the period
  const newCustomers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      createdAt: { gte: startDate },
    },
    select: { createdAt: true },
  });

  // Group by date
  const revenueByDate = {};
  const ordersByDate = {};
  const customersByDate = {};

  // Initialize all dates
  for (let i = 0; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    revenueByDate[key] = 0;
    ordersByDate[key] = 0;
    customersByDate[key] = 0;
  }

  // Aggregate orders
  orders.forEach((order) => {
    const key = order.createdAt.toISOString().split("T")[0];
    if (revenueByDate[key] !== undefined) {
      if (order.paymentStatus === "PAID") {
        revenueByDate[key] += parseFloat(order.totalAmount);
      }
      ordersByDate[key]++;
    }
  });

  // Aggregate customers
  newCustomers.forEach((customer) => {
    const key = customer.createdAt.toISOString().split("T")[0];
    if (customersByDate[key] !== undefined) {
      customersByDate[key]++;
    }
  });

  // Convert to arrays sorted by date
  const sortedDates = Object.keys(revenueByDate).sort();
  const revenueData = sortedDates.map((date) => ({
    date,
    value: revenueByDate[date],
  }));
  const ordersData = sortedDates.map((date) => ({
    date,
    value: ordersByDate[date],
  }));
  const customersData = sortedDates.map((date) => ({
    date,
    value: customersByDate[date],
  }));

  // Calculate totals
  const totalRevenue = Object.values(revenueByDate).reduce((a, b) => a + b, 0);
  const totalOrders = Object.values(ordersByDate).reduce((a, b) => a + b, 0);
  const totalNewCustomers = Object.values(customersByDate).reduce(
    (a, b) => a + b,
    0
  );

  res.json({
    success: true,
    data: {
      period: days,
      totals: {
        revenue: totalRevenue,
        orders: totalOrders,
        customers: totalNewCustomers,
      },
      charts: {
        revenue: revenueData,
        orders: ordersData,
        customers: customersData,
      },
    },
  });
});

export default {
  getDashboardStats,
  getAnalytics,
};
