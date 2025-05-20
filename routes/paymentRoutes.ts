import { Router } from "express";
const router = Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  coursePayment,
  getAllPaymentHistoryUser,
  getSinglePaymentHistoryUser,
} from "../controllers/paymentController.js";

// Get all payment methods
router
  .route("/")
  .post(authenticateUser, addPaymentMethod)
  .get(authenticateUser, getAllPaymentMethods);

router
  .route("/:id")
  .delete(authenticateUser, deletePaymentMethod)
  .patch(authenticateUser, setDefaultPaymentMethod);

router.route("/coursePayment").post(authenticateUser, coursePayment);

router
  .route("/paymentHistoryUser")
  .post(authenticateUser, getAllPaymentHistoryUser);

router
  .route("/paymentHistoryUser/:id")
  .get(authenticateUser, getSinglePaymentHistoryUser);

export default router;
