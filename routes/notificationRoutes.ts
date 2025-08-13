import express from "express";
const router = express.Router();

import {
  createNotification,
  fetchNotifications,
  getSingleNotification,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

import { authenticateUser } from "../middleware/authentication.js";

router
  .route("/")
  .post(createNotification)
  .get(authenticateUser, fetchNotifications);
router.route("/:notificationId").get(authenticateUser, getSingleNotification);
router.route("/read/:notificationId").patch(authenticateUser, markAsRead);
router.route("/read-all/").patch(authenticateUser, markAllAsRead);

export default router;
