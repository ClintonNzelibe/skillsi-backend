import express from "express";
const router = express.Router();

// import { authenticateTutor } from "../middleware/authentication.js";

import rateLimiter from "express-rate-limit";

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

import {
  signupAffiliate,
  verifyEmail,
  resendToken,
  signinAffiliate,
} from "../controllers/affiliateAuthController.js";

router.route("/signupAffiliate").post(signupAffiliate);
router.route("/verifyEmail").post(verifyEmail);
router.route("/resendToken").post(resendToken);
router.route("/signinAffiliate").post(apiLimiter, signinAffiliate);
// router.route("/logout").post(authenticateUser, logout);

export default router;
