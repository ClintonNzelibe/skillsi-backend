import { Router } from "express";
const router = Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  getAllPaymentHistoryUser,
  getSinglePaymentHistoryUser,
} from "../controllers/paymentHistoryController.js";

router.route("/user").post(authenticateUser, getAllPaymentHistoryUser);

// router
//   .route("/paymentHistoryUser")
//   .post(authenticateUser, get FAllPaymentHistoryUser);

// router
//   .route("/paymentHistoryUser/:id")
//   .get(authenticateUser, getSinglePaymentHistoryUser);

export default router;
