import express from "express";
const router = express.Router();

import {
  authenticateAffiliate,
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
  .patch(authenticateAffiliate, updateAffiliateProfile);

router.route("/currentTutor").get(authenticateAffiliate, currentAffiliate);

router.route("/forgotPassword").post(forgotPassword);

router.route("/verifyResetPasswordToken").post(verifyResetPasswordToken);

router.route("/resetPassword").patch(resetPassword);

router.route("/resendToken").post(resendToken);

router.route("/changePassword").patch(authenticateAffiliate, changePassword);

export default router;
