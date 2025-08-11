import express from "express";
const router = express.Router();

import { authenticateAdmin } from "../middleware/authentication.js";

import rateLimiter from "express-rate-limit";

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

import {
  signupAdmin,
  signinAdmin,
} from "../controllers/adminAuthController.js";

router.route("/signupAdmin").post(signupAdmin);
router.route("/signinAdmin").post(apiLimiter, signinAdmin);

export default router;
