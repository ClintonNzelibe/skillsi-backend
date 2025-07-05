import express from "express";
const router = express.Router();

import {
  authenticateTutor,
  authenticateUser,
} from "../middleware/authentication.js";

import {
  createQuestion,
  answerQuestion,
  getTutorQuestions,
  getUserQuestions,
} from "../controllers/courseQAController.js";

// ✅ Create a question
router.route("/").post(authenticateUser, createQuestion);

// ✅ Tutor answers a question
router.route("/answer/:questionId").patch(authenticateTutor, answerQuestion);

// ✅ Tutor gets all questions for their course
router.route("/tutor/:courseId").get(authenticateTutor, getTutorQuestions);

// ✅ User gets all questions + answers for a course
router.route("/user/:courseId").get(authenticateUser, getUserQuestions);


export default router;
