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

const router = Router();

// User's reviews
router.get("/me", validate(paginationSchema, "query"), getMyReviews);

// CRUD for reviews
router.post("/", validate(createReviewSchema), createReview);
router.put(
  "/:id",
  validate({ params: reviewIdSchema, body: updateReviewSchema }),
  updateReview
);
router.delete("/:id", validate({ params: reviewIdSchema }), deleteReview);

// Product reviews
router.get(
  "/product/:productId",
  validate({
    params: getProductReviewsParamsSchema,
    query: getProductReviewsQuerySchema,
  }),
  getProductReviews
);

export default router;
