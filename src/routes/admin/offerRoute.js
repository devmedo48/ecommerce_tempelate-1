import { Router } from "express";
import {
  createOffer,
  getOffers,
  getOffer,
  updateOffer,
  deleteOffer,
} from "../../controllers/admin/offerController.js";
import {
  validate,
  createOfferSchema,
  updateOfferSchema,
  getOffersSchema,
  offerIdSchema,
} from "../../validation/index.js";

const router = Router();

router.post("/", validate(createOfferSchema), createOffer);
router.get("/", validate(getOffersSchema, "query"), getOffers);
router.get("/:id", validate({ params: offerIdSchema }), getOffer);
router.put(
  "/:id",
  validate({ params: offerIdSchema, body: updateOfferSchema }),
  updateOffer
);
router.delete("/:id", validate({ params: offerIdSchema }), deleteOffer);

export default router;
