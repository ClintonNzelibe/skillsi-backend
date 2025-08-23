import express from "express";
const router = express.Router();

import {
  authenticateTutor,
  authenticateAffiliate,
} from "../middleware/authentication.js";

import {
  createShortLink,
  getShortLink,
  getAllPromotedCourses,
  getTutorAffiliateCourses,
} from "../controllers/shortLinkController.js";

router
  .route("/:courseId")
  .post(authenticateAffiliate, createShortLink)
  .get(authenticateTutor, getTutorAffiliateCourses);

router
  .route("/affiliate/getAllPromotedCourses")
  .get(authenticateAffiliate, getAllPromotedCourses);

// Get all reviews for tutor's courses
router.route("/getShortLink/:shortCode").post(getShortLink);

export default router;
