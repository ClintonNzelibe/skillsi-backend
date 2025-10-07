import { Router } from "express";
const router = Router();

import { authenticateGeneral } from "../middleware/authentication.js";

import {
  getAllPaymentHistory,
  getSinglePaymentHistory,
} from "../controllers/paymentHistoryController.js";

router.route("/").get(authenticateGeneral, getAllPaymentHistory);

router
  .route("/:paymentHistoryId")
  .get(authenticateGeneral, getSinglePaymentHistory);

// router
//   .route("/paymentHistoryUser/:id")
//   .get(authenticateUser, getSinglePaymentHistoryUser);

export default router;
