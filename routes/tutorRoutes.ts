import express from "express";
const router = express.Router();

import { authenticateTutor } from "../middleware/authentication.js";

import {
  updateTutorProfile,
  currentTutor,
} from "../controllers/tutorController.js";

router.route("/updateTutorProfile").patch(authenticateTutor, updateTutorProfile);

router.route("/currentTutor").get(authenticateTutor, currentTutor);

export default router;
