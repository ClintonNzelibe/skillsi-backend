import express from "express";
const router = express.Router();
import { authenticateUser, authenticateAdmin, } from "../middleware/authentication.js";
import { changeProfilePicture, changePassword, closeAccount, updateNotificationPreferences, toggleReminder, currentUser, forgotPassword, verifyTokenResetPassword, resetPassword, resendToken, fetchAllUsers, fetchSingleUser, } from "../controllers/userController.js";
router
    .route("/changeProfilePicture")
    .patch(authenticateUser, changeProfilePicture);
router.route("/changePassword").patch(authenticateUser, changePassword);
router.route("/closeAccount").post(authenticateUser, closeAccount);
router
    .route("/updateNotificationPreferences")
    .patch(authenticateUser, updateNotificationPreferences);
router.route("/toggleReminder").post(authenticateUser, toggleReminder);
router.route("/currentUser").get(authenticateUser, currentUser);
router.route("/forgotPassword").post(forgotPassword);
router.route("/verifyTokenResetPassword").post(verifyTokenResetPassword);
router.route("/resetPassword").patch(resetPassword);
router.route("/resendToken").post(resendToken);
router.route("/fetchAllUsers").get(authenticateAdmin, fetchAllUsers);
router
    .route("/fetchSingleUser/:userId")
    .get(authenticateAdmin, fetchSingleUser);
export default router;
