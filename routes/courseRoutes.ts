import express from "express";
const router = express.Router();

import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/authentication.js";

import {
  createCourse,
  //   getAllTrainingsAdmin,
  //   getSingleTrainingAdmin,
  //   updateTraining,
  //   deleteTraining,
  fetchAllCoursesUser,
  fetchSingleCourseUser,
} from "../controllers/courseController.js"; // Adjust the import path


router.route("/createCourse").post(authenticateAdmin, createCourse);

router.route("/fetchAllCoursesUser").get(authenticateUser, fetchAllCoursesUser);

router
  .route("/fetchSingleCourseUser/:courseId")
  .get(authenticateUser, fetchSingleCourseUser);

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
