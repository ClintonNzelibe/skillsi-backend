import express from "express";
const router = express.Router();

import {
  authenticateTutor,
  authenticateUser,
} from "../middleware/authentication.js";

import {
  updateTutorProfile,
  currentTutor,
  forgotPassword,
  verifyTokenResetPassword,
  resetPassword,
  resendToken,
  changePassword,
  getTutorProfile,
} from "../controllers/tutorController.js";

router
  .route("/updateTutorProfile")
  .patch(authenticateTutor, updateTutorProfile);

router.route("/currentTutor").get(authenticateTutor, currentTutor);

router.route("/forgotPassword").post(forgotPassword);

router.route("/verifyTokenResetPassword").post(verifyTokenResetPassword);

router.route("/resetPassword").patch(resetPassword);

router.route("/resendToken").post(resendToken);

router.route("/changePassword").patch(authenticateTutor, changePassword);

router
  .route("/getTutorProfile/:tutorId")
  .get(authenticateUser, getTutorProfile);

export default router;
