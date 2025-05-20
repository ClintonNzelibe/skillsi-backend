import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  changeProfilePicture,
  changePassword,
  closeAccount,
  updateNotificationPreferences,
  currentUser,
} from "../controllers/userController.js";

router
  .route("/changeProfilePicture")
  .patch(authenticateUser, changeProfilePicture);

router.route("/changePassword").patch(authenticateUser, changePassword);

router.route("/closeAccount").post(authenticateUser, closeAccount);

router
  .route("/updateNotificationPreferences")
  .patch(authenticateUser, updateNotificationPreferences);

router.route("/currentUser").get(authenticateUser, currentUser);

export default router;
