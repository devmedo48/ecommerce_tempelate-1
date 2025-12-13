import { Router } from "express";
import { upload } from "../../config/upload.js";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../../controllers/admin/productController.js";
import {
  validate,
  adminGetProductsSchema,
  adminProductIdSchema,
  updateProductSchema,
} from "../../validation/index.js";

const router = Router();

router.get("/", validate(adminGetProductsSchema, "query"), getProducts);
router.get("/:id", validate({ params: adminProductIdSchema }), getProduct);
router.post("/", upload.array("images", 10), createProduct);
router.put(
  "/:id",
  validate({ params: adminProductIdSchema, body: updateProductSchema }),
  updateProduct
);
router.delete(
  "/:id",
  validate({ params: adminProductIdSchema }),
  deleteProduct
);

export default router;
