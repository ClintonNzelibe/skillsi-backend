import { Router } from "express";
const router = Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  paystackWebhook,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  coursePayment,
} from "../controllers/paymentController.js";

// Get all payment methods
router.route("/webhook").post(paystackWebhook);

router
  .route("/addPaymentMethod")
  .post(authenticateUser, addPaymentMethod)
  .get(authenticateUser, getAllPaymentMethods);

router
  .route("/:id")
  .delete(authenticateUser, deletePaymentMethod)
  .patch(authenticateUser, setDefaultPaymentMethod);

router.route("/coursePayment").post(authenticateUser, coursePayment);

router.route("/coursePayment").post(authenticateUser, coursePayment);

export default router;
