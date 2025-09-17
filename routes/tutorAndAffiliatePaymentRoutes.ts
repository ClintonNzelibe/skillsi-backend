import { Router } from "express";
const router = Router();

import { authenticateGeneral } from "../middleware/authentication.js";

import {
  addBankAccount,
  accountName,
  withdrawalFromBalance,
  getAllBankPaymentMethods,
} from "../controllers/tutorAndAffiliatePaymentController.js";

router
  .route("/withdrawalFromBalance")
  .post(authenticateGeneral, withdrawalFromBalance);

router
  .route("/getAllBankPaymentMethods")
  .get(authenticateGeneral, getAllBankPaymentMethods);

router
  .route("/addBankAccount")
  .post(authenticateGeneral, addBankAccount);

router.route("/accountName").post(accountName);

export default router;
