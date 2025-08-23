import express from "express";
const router = express.Router();

import {
  authenticateUser,
  authenticateTutor,
  authenticateAffiliate,
} from "../middleware/authentication.js";

import {
  createCourse,
  updateCourse,
  fetchAllCoursesUser,
  fetchSingleCourseUser,
  fetchAllCoursesTutor,
  fetchSingleCourseTutor,
  fetchAllCoursesAffiliate,
  fetchSingleCourseAffiliate,
} from "../controllers/courseController.js"; // Adjust the import path

router.route("/createCourse").post(authenticateTutor, createCourse);

router.route("/updateCourse/:courseId").patch(authenticateTutor, updateCourse);

router.route("/fetchAllCoursesUser").get(authenticateUser, fetchAllCoursesUser);

router
  .route("/fetchSingleCourseUser/:courseId")
  .get(authenticateUser, fetchSingleCourseUser);

router
  .route("/fetchAllCoursesTutor")
  .get(authenticateTutor, fetchAllCoursesTutor);

router
  .route("/fetchSingleCourseTutor/:courseId")
  .get(authenticateTutor, fetchSingleCourseTutor);

router
  .route("/fetchAllCoursesAffiliate")
  .get(authenticateAffiliate, fetchAllCoursesAffiliate);

router
  .route("/fetchSingleCourseAffiliate/:courseId")
  .get(authenticateAffiliate, fetchSingleCourseAffiliate);

// router
//   .route("/deleteTraining/:trainingId")
//   .delete(authenticateAdmin, deleteTraining);

export default router;
