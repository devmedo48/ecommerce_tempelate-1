/**
 * Cart Controller - Customer
 * Handles shopping cart operations with server-side persistence
 */

import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";
import { calculateDiscountedPrice } from "../../utils/offerUtils.js";

/**
 * Get or create user's cart with items
 */
async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              offer: true,
              modifiers: { include: { options: true } },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                offer: true,
                modifiers: { include: { options: true } },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

/**
 * Calculate cart totals
 */
function calculateCartTotals(items) {
  let subtotal = 0;

  const itemsWithPrice = items.map((item) => {
    const priceInfo = calculateDiscountedPrice(item.product);
    const basePrice = Number(priceInfo.finalPrice);

    // Calculate modifier prices
    let modifierPrice = 0;
    if (item.modifiers && item.product.modifiers) {
      item.product.modifiers.forEach((mod) => {
        const selected = item.modifiers[mod.id];
        if (!selected) return;

        if (Array.isArray(selected)) {
          selected.forEach((optId) => {
            const opt = mod.options.find((o) => o.id === optId);
            if (opt) modifierPrice += Number(opt.price);
          });
        } else {
          const opt = mod.options.find((o) => o.id === selected);
          if (opt) modifierPrice += Number(opt.price);
        }
      });
    }

    const itemTotal = (basePrice + modifierPrice) * item.quantity;
    subtotal += itemTotal;

    return {
      id: item.id,
      productId: item.productId,
      product: {
        id: item.product.id,
        name: item.product.name,
        images: item.product.images,
        price: item.product.price,
        ...priceInfo,
      },
      quantity: item.quantity,
      modifiers: item.modifiers,
      unitPrice: basePrice + modifierPrice,
      total: itemTotal,
    };
  });

  return { items: itemsWithPrice, subtotal };
}

/**
 * @desc Get user's cart
 * @route GET /api/v1/customer/cart
 */
export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await getOrCreateCart(userId);
  const { items, subtotal } = calculateCartTotals(cart.items);

  res.json({
    success: true,
    data: {
      id: cart.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    },
  });
});

/**
 * @desc Add item to cart
 * @route POST /api/v1/customer/cart/items
 */
export const addItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1, modifiers = {} } = req.body;

  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  // Verify product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
  }

  const cart = await getOrCreateCart(userId);

  // Check if item with same modifiers exists
  const existingItem = cart.items.find(
    (item) =>
      item.productId === productId &&
      JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
  );

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        modifiers: Object.keys(modifiers).length > 0 ? modifiers : undefined,
      },
    });
  }

  // Return updated cart
  const updatedCart = await getOrCreateCart(userId);
  const { items, subtotal } = calculateCartTotals(updatedCart.items);

  res.json({
    success: true,
    message: "Item added to cart",
    data: {
      id: updatedCart.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    },
  });
});

/**
 * @desc Update cart item quantity
 * @route PUT /api/v1/customer/cart/items/:itemId
 */
export const updateItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== "number" || quantity < 0) {
    throw new AppError("Invalid quantity", 400);
  }

  // Verify item belongs to user
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError("Cart item not found", 404);
  }

  if (quantity === 0) {
    // Remove item
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  // Return updated cart
  const cart = await getOrCreateCart(userId);
  const { items, subtotal } = calculateCartTotals(cart.items);

  res.json({
    success: true,
    message: quantity === 0 ? "Item removed from cart" : "Cart updated",
    data: {
      id: cart.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    },
  });
});

/**
 * @desc Remove item from cart
 * @route DELETE /api/v1/customer/cart/items/:itemId
 */
export const removeItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  // Verify item belongs to user
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError("Cart item not found", 404);
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  // Return updated cart
  const cart = await getOrCreateCart(userId);
  const { items, subtotal } = calculateCartTotals(cart.items);

  res.json({
    success: true,
    message: "Item removed from cart",
    data: {
      id: cart.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    },
  });
});

/**
 * @desc Clear cart
 * @route DELETE /api/v1/customer/cart
 */
export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  res.json({
    success: true,
    message: "Cart cleared",
    data: {
      id: cart?.id,
      items: [],
      itemCount: 0,
      subtotal: 0,
    },
  });
});

/**
 * @desc Sync cart from client (merge local cart with server)
 * @route POST /api/v1/customer/cart/sync
 */
export const syncCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { items: clientItems = [] } = req.body;

  const cart = await getOrCreateCart(userId);

  // Add/update items from client
  for (const clientItem of clientItems) {
    if (!clientItem.productId) continue;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: clientItem.productId },
    });

    if (!product || !product.isActive) continue;

    const modifiers = clientItem.modifiers || {};

    // Check if exists
    const existingItem = cart.items.find(
      (item) =>
        item.productId === clientItem.productId &&
        JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
    );

    if (existingItem) {
      // Keep the higher quantity
      const newQty = Math.max(existingItem.quantity, clientItem.quantity || 1);
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: clientItem.productId,
          quantity: clientItem.quantity || 1,
          modifiers: Object.keys(modifiers).length > 0 ? modifiers : undefined,
        },
      });
    }
  }

  // Return updated cart
  const updatedCart = await getOrCreateCart(userId);
  const { items, subtotal } = calculateCartTotals(updatedCart.items);

  res.json({
    success: true,
    message: "Cart synced",
    data: {
      id: updatedCart.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    },
  });
});
