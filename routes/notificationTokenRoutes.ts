import express from "express";
const router = express.Router();

import {
  addNotificationToken,
  testSendNotification,
} from "../controllers/notificationTokenController.js";

import { authenticateUser } from "../middleware/authentication.js";

router
  .route("/addNotificationToken")
  .post( authenticateUser, addNotificationToken)

router
  .route("/testSendNotification")
  .post(testSendNotification);

export default router;
