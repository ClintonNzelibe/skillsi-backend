import express from "express";
const router = express.Router();

import {
  createTutorReview,
  editTutorReview,
  deleteTutorReview,
  fetchTutorReviews,
} from "../controllers/tutorReviewController.js";

import {
  authenticateUser,
  authenticateUserOrTutorOrAdmin,
} from "../middleware/authentication.js";

router
  .route("/")
  .post(authenticateUser, createTutorReview)
  .get(authenticateUserOrTutorOrAdmin, fetchTutorReviews);

router
  .route("/:reviewId")
  .patch(authenticateUser, editTutorReview)
  .delete(authenticateUserOrTutorOrAdmin, deleteTutorReview);

export default router;
