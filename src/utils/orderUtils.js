import Decimal from "./decimal.js";

export const applyFirstOrderDiscount = (orderGroups) => {
  if (orderGroups.length > 0) {
    if (orderGroups.length === 1) {
      const group = orderGroups[0];
      const originalDeliveryFee = new Decimal(group.invoice.deliveryFee);
      if (originalDeliveryFee.gt(0)) {
        group.invoice.deliveryFee = "0.00";
        group.invoice.grandTotal = new Decimal(group.invoice.grandTotal)
          .minus(originalDeliveryFee)
          .toFixed(2);
      }
    } else {
      // Find the largest group by grandTotal
      const largestGroup = orderGroups.reduce((max, current) => {
        return new Decimal(current.invoice.grandTotal).greaterThan(
          new Decimal(max.invoice.grandTotal)
        )
          ? current
          : max;
      });

      const originalDeliveryFee = new Decimal(largestGroup.invoice.deliveryFee);
      if (originalDeliveryFee.gt(0)) {
        largestGroup.invoice.deliveryFee = "0.00";
        largestGroup.invoice.grandTotal = new Decimal(
          largestGroup.invoice.grandTotal
        )
          .minus(originalDeliveryFee)
          .toFixed(2);
      }
    }
  }
  return orderGroups;
};
