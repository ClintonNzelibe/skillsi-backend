import express from "express";
const router = express.Router();

import {
  createNotification,
  fetchAllNotifications,
  getSingleNotification,
  markANotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

import { authenticateUser } from "../middleware/authentication.js";

router
  .route("/")
  .post(createNotification)
  .get(authenticateUser, fetchAllNotifications);

router.route("/:notificationId").get(authenticateUser, getSingleNotification);

router.route("/read/:notificationId").patch(authenticateUser, markANotificationAsRead);

router.route("/read-all").patch(authenticateUser, markAllNotificationsAsRead);

export default router;
