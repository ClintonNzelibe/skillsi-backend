import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  addToWishList,
  getWishList,
  removeFromWishList,
  clearWishList,
} from "../controllers/wishListController.js";

// router.use(authenticateUser); // Protect all routes

router
  .route("/")
  .post(authenticateUser, addToWishList)
  .get(authenticateUser, getWishList)
  .delete(authenticateUser, clearWishList);

router.route("/:id").delete(authenticateUser, removeFromWishList);

export default router;
