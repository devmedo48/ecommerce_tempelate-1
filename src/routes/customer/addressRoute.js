import { Router } from "express";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "../../controllers/customer/addressController.js";
import { validate, addressSchema, uuidSchema } from "../../validation/index.js";

const router = Router();

router.get("/", getAddresses);
router.post("/", validate(addressSchema), createAddress);
router.put(
  "/:id",
  validate({ params: { id: uuidSchema }, body: addressSchema.partial() }),
  updateAddress
);
router.delete("/:id", validate({ params: { id: uuidSchema } }), deleteAddress);
router.put(
  "/default/:id",
  validate({ params: { id: uuidSchema } }),
  setDefaultAddress
);

export default router;
