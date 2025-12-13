import { Router } from "express";
import {
  getProducts,
  getProduct,
} from "../../controllers/customer/productController.js";
import {
  validate,
  getProductsSchema,
  getProductSchema,
} from "../../validation/index.js";

const router = Router();

router.get("/", validate(getProductsSchema, "query"), getProducts);
router.get("/:id", validate({ params: getProductSchema }), getProduct);

export default router;
