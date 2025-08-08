import express from "express";
const router = express.Router();

import {
  authenticateTutor,
  authenticateUser,
  authenticateUserOrTutorOrAdmin,
} from "../middleware/authentication.js";

import {
  createReview,
  getUserReviews,
  getTutorReviews,
  updateReview,
  deleteReview,
  updateReviewStatus
} from "../controllers/courseReviewController.js";

// Create a review (User)
router.route("/:courseId").post(authenticateUser, createReview);

// Get all reviews by user
router.route("/getUserReviews").post(authenticateUser, getUserReviews);

// Get all reviews for tutor's courses
router.route("/getTutorReviews").post(authenticateTutor, getTutorReviews);

// Update a review (User)
router.patch("/:reviewId", authenticateUser, updateReview);

// ✅ Single delete route for both user and tutor
router.delete("/:reviewId", authenticateUserOrTutorOrAdmin, deleteReview);

// Approve a review (Tutor)
router.patch("/updatestatus/:reviewId", authenticateTutor, updateReviewStatus);

export default router;
