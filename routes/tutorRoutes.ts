import express from "express";
const router = express.Router();

import { authenticateTutor } from "../middleware/authentication.js";

import {
  updateTutorProfile,
  currentTutor,
  forgotPassword,
  verifyEmailResetPassword,
  resetPassword,
  resendToken,
} from "../controllers/tutorController.js";

router
  .route("/updateTutorProfile")
  .patch(authenticateTutor, updateTutorProfile);

router.route("/currentTutor").get(authenticateTutor, currentTutor);

router.route("/forgotPassword").post(forgotPassword);

router.route("/verifyEmailResetPassword").post(verifyEmailResetPassword);

router.route("/resetPassword").patch(resetPassword);

router.route("/resendToken").post(resendToken);

export default router;
