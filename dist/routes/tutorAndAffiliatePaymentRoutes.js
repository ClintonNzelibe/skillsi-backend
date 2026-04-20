import { Router } from "express";
const router = Router();
import { authenticateGeneral } from "../middleware/authentication.js";
import { accountName, addBankAccount, getAllBankPaymentMethods, deletePaymentMethod, withdrawalFromBalance, confirmWithdrawal, resendWithdrawalOtp, } from "../controllers/tutorAndAffiliatePaymentController.js";
router.route("/accountName").post(accountName);
router.route("/addBankAccount").post(authenticateGeneral, addBankAccount);
router
    .route("/getAllBankPaymentMethods")
    .get(authenticateGeneral, getAllBankPaymentMethods);
router.route("/:methodId").delete(authenticateGeneral, deletePaymentMethod);
router
    .route("/withdrawalFromBalance")
    .post(authenticateGeneral, withdrawalFromBalance);
router
    .route("/confirmWithdrawal/:pendingId")
    .post(authenticateGeneral, confirmWithdrawal);
router
    .route("/resendWithdrawalOtp/:pendingId")
    .patch(authenticateGeneral, resendWithdrawalOtp);
export default router;
