import { Router } from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getProductReviews,
} from "../../controllers/customer/reviewController.js";
import {
  validate,
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  getProductReviewsParamsSchema,
  getProductReviewsQuerySchema,
  paginationSchema,
} from "../../validation/index.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Public: Get product reviews
router.get(
  "/product/:productId",
  validate({
    params: getProductReviewsParamsSchema,
    query: getProductReviewsQuerySchema,
  }),
  getProductReviews
);

// Protected: User's own reviews and CRUD
router.get(
  "/me",
  authenticate,
  validate(paginationSchema, "query"),
  getMyReviews
);
router.post("/", authenticate, validate(createReviewSchema), createReview);
router.put(
  "/:id",
  authenticate,
  validate({ params: reviewIdSchema, body: updateReviewSchema }),
  updateReview
);
router.delete(
  "/:id",
  authenticate,
  validate({ params: reviewIdSchema }),
  deleteReview
);

export default router;
