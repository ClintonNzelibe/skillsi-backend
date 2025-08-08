import express from "express";

import {
  authenticateTutor,
  authenticateUser,
  authenticateUserOrTutorOrAdmin,
} from "../middleware/authentication.js";

import {
  editCategory,
  createCategory,
  fetchCategories,
} from "../controllers/categoryController";

const router = express.Router();

router.route("/").post(createCategory).get(authenticateUserOrTutorOrAdmin, fetchCategories);
router.route("/:id").put(editCategory);

export default router;
