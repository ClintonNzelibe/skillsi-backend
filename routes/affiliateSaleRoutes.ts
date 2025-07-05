import express from "express";
const router = express.Router();

import {
  authenticateTutor,
  //   authenticateUser,
} from "../middleware/authentication.js";

import { getAffiliateSalesByCourse } from "../controllers/affiliateSaleController.js";

router
  .route("/getAffiliateSalesByCourse/:courseId")
  .get(authenticateTutor, getAffiliateSalesByCourse);

export default router;
