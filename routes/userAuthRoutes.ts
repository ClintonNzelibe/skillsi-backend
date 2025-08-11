import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import rateLimiter from "express-rate-limit";

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

import {
  register,
  verifyEmail,
  resendToken,
  login,
  logout,
} from "../controllers/userAuthController.js";

router.route("/register").post(register);
router.route("/verifyEmail").post(verifyEmail);
router.route("/resendToken").post(resendToken);
router.route("/login").post(apiLimiter, login);
router.route("/logout").post(authenticateUser, logout);

export default router;
