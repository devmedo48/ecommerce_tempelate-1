/**
 * Utility functions for offer/discount price calculations
 */

/**
 * Check if an offer is currently active
 * @param {Object} offer - The offer object
 * @returns {boolean}
 */
export const isOfferActive = (offer) => {
  if (!offer || !offer.isActive) return false;
  const now = new Date();
  return now >= new Date(offer.startDate) && now <= new Date(offer.endDate);
};

/**
 * Calculate the discounted price for a product with an offer
 * @param {Object} product - Product with offer relation included
 * @returns {Object} { originalPrice, finalPrice, hasOffer, discount, offerName }
 */
export const calculateDiscountedPrice = (product) => {
  const originalPrice = Number(product.price);
  let finalPrice = originalPrice;
  let discount = 0;
  let hasOffer = false;
  let offerName = null;

  if (product.offer && isOfferActive(product.offer)) {
    hasOffer = true;
    offerName = product.offer.name;

    if (product.offer.type === "PERCENTAGE") {
      discount = originalPrice * (Number(product.offer.value) / 100);
    } else {
      discount = Number(product.offer.value);
    }

    finalPrice = Math.max(0, originalPrice - discount);
  }

  return {
    originalPrice,
    finalPrice,
    hasOffer,
    discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
    offerName,
  };
};

/**
 * Apply discount to a base price
 * @param {number} price - Base price
 * @param {Object} offer - Offer object with type and value
 * @returns {number} Discounted price
 */
export const applyDiscount = (price, offer) => {
  if (!offer) return price;

  let discount = 0;
  if (offer.type === "PERCENTAGE") {
    discount = price * (Number(offer.value) / 100);
  } else {
    discount = Number(offer.value);
  }

  return Math.max(0, price - discount);
};
