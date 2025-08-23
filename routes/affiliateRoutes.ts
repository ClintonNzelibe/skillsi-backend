import express from "express";
const router = express.Router();

import {
  authenticateTutor,
  authenticateUser,
} from "../middleware/authentication.js";

import {
  updateAffiliateProfile,
  currentAffiliate,
  forgotPassword,
  verifyResetPasswordToken,
  resetPassword,
  resendToken,
  changePassword,
} from "../controllers/affiliateController.js";

router
  .route("/updateTutorProfile")
  .patch(authenticateTutor, updateAffiliateProfile);

router.route("/currentTutor").get(authenticateTutor, currentAffiliate);

router.route("/forgotPassword").post(forgotPassword);

router.route("/verifyResetPasswordToken").post(verifyResetPasswordToken);

router.route("/resetPassword").patch(resetPassword);

router.route("/resendToken").post(resendToken);

router.route("/changePassword").patch(authenticateTutor, changePassword);

export default router;
