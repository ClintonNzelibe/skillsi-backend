import express from "express";

import {
  authenticateAdmin,
  authenticateUserOrTutorOrAdmin,
} from "../middleware/authentication.js";

import {
  editCategory,
  createCategory,
  fetchCategories,
} from "../controllers/categoryController.js";

const router = express.Router();

router.route("/").post(authenticateAdmin, createCategory).get(authenticateUserOrTutorOrAdmin, fetchCategories);
router.route("/:id").patch(authenticateAdmin, editCategory);

export default router;
