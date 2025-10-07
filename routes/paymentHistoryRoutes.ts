import { Router } from "express";
const router = Router();

import { authenticateGeneral } from "../middleware/authentication.js";

import {
  getAllPaymentHistory,
  // getSinglePaymentHistoryUser,
} from "../controllers/paymentHistoryController.js";

router.route("/").get(authenticateGeneral, getAllPaymentHistory);

// router
//   .route("/paymentHistoryUser")
//   .post(authenticateUser, get FAllPaymentHistoryUser);

// router
//   .route("/paymentHistoryUser/:id")
//   .get(authenticateUser, getSinglePaymentHistoryUser);

export default router;
