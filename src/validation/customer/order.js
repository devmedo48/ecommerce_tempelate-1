import { z } from "zod";
import { addressSchema } from "./address.js";

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  modifiers: z
    .array(
      z.object({
        modifierId: z.string().uuid(),
        optionId: z.string().uuid(),
      })
    )
    .optional(),
});

export const placeOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(["COD", "ONLINE"]),

    // Two options for address: existing ID or new address details
    addressId: z.string().uuid().optional(),
    newAddress: addressSchema.optional(),
  })
  .refine((data) => data.addressId || data.newAddress, {
    message: "Either addressId or newAddress must be provided",
    path: ["addressId"],
  });
