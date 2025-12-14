/**
 * Admin Customer Routes
 */

import { Router } from "express";
import {
  getCustomers,
  getCustomer,
  updateCustomer,
} from "../../controllers/admin/customerController.js";

const router = Router();

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);

export default router;
