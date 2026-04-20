import { Router } from "express";
const router = Router();
console.log("🔥 PAYMENT ROUTES LOADED")

// 👇 ADD THIS RIGHT AFTER router is created
router.get("/test", (req, res) => {
  res.send("Payment route works");
});
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
  .route("/handlePaymentMethod")
  .post(authenticateUser, addPaymentMethod)
  .get(authenticateUser, getAllPaymentMethods);

router
  .route("/:methodId")
  .delete(authenticateUser, deletePaymentMethod)
  .patch(authenticateUser, setDefaultPaymentMethod);

router.route("/coursePayment").post(authenticateUser, coursePayment);



export default router;
