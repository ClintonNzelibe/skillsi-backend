import express from "express";
const router = express.Router();

import { authenticateTutor } from "../middleware/authentication.js";

import rateLimiter from "express-rate-limit";

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

import { signupTutor, signinTutor, } from "../controllers/tutorAuthController.js";

router.route("/signupTutor").post(signupTutor);
router.route("/signinTutor").post(apiLimiter, signinTutor);
// router.route("/logout").post(authenticateUser, logout);

export default router;
