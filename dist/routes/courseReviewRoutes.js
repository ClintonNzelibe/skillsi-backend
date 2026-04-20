import express from "express";
const router = express.Router();
import { authenticateTutor, authenticateUser, authenticateGeneral, } from "../middleware/authentication.js";
import { createReview, getUserReviews, getTutorReviews, updateReview, deleteReview, updateReviewStatus, } from "../controllers/courseReviewController.js";
// Create a review (User)
router.route("/:courseId").post(authenticateUser, createReview);
// Get all reviews by user
router.route("/getUserReviews/:courseId").get(authenticateUser, getUserReviews);
// Get all reviews for tutor's courses
router
    .route("/getTutorReviews/:courseId")
    .get(authenticateTutor, getTutorReviews);
// Update a review (User)
router
    .route("/:reviewId")
    .patch(authenticateUser, updateReview)
    .delete(authenticateGeneral, deleteReview);
// Approve a review (Tutor)
router
    .route("/updatestatus/:reviewId")
    .patch(authenticateTutor, updateReviewStatus);
export default router;
