import { Router } from "express";
const router = Router();

import { authenticateUserOrTutorOrAdmin } from "../middleware/authentication.js";

import {
  addBankAccount,
  accountName,
  withdrawalFromBalance,
  getAllBankPaymentMethods,
} from "../controllers/tutorAndAffiliatePaymentController.js";

router
  .route("/withdrawalFromBalance")
  .post(authenticateUserOrTutorOrAdmin, withdrawalFromBalance);

router
  .route("/getAllBankPaymentMethods")
  .get(authenticateUserOrTutorOrAdmin, getAllBankPaymentMethods);

router
  .route("/addBankAccount")
  .post(authenticateUserOrTutorOrAdmin, addBankAccount);

router.route("/accountName").post(accountName);

export default router;
