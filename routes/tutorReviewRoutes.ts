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
  authenticateGeneral,
} from "../middleware/authentication.js";

router
  .route("/")
  .post(authenticateUser, createTutorReview)
  .get(authenticateGeneral, fetchTutorReviews);

router
  .route("/:reviewId")
  .patch(authenticateUser, editTutorReview)
  .delete(authenticateGeneral, deleteTutorReview);

export default router;
