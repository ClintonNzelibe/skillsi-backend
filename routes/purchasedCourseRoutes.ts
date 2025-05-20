import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  fetchPaidCoursesUser,
  fetchSinglePaidCourseUser,
} from "../controllers/purchasedCourseController.js"; // Adjust the import path

router
  .route("/fetchPaidCoursesUser")
  .get(authenticateUser, fetchPaidCoursesUser);
  
router
  .route("/fetchSinglePaidCourseUser/:courseId")
  .get(authenticateUser, fetchSinglePaidCourseUser);

// router
//   .route("/getAllTrainingsAdmin")
//   .post(authenticateAdmin, getAllTrainingsAdmin);

// router
//   .route("/getSingleTrainingAdmin/:trainingId")
//   .get(authenticateAdmin, getSingleTrainingAdmin);

// router
//   .route("/updateTraining/:trainingId")
//   .patch(authenticateAdmin, updateTraining);

// router
//   .route("/deleteTraining/:trainingId")
//   .delete(authenticateAdmin, deleteTraining);

export default router;
