import { StatusCodes } from "http-status-codes";
import PaymentHistory from "../models/PaymentHistory.js";
const getAllPaymentHistory = async (req, res) => {
    try {
        const { customerModel } = req.query;
        let customerId;
        if (customerModel === "Tutor") {
            customerId = req.tutor?.tutorId;
        }
        else if (customerModel === "Affiliate") {
            customerId = req.affiliate?.affiliateId;
        }
        else if (customerModel === "User") {
            customerId = req.user?.userId;
        }
        else {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid Customer Model",
            });
        }
        if (!customerId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: `${customerModel} Id can't be empty`,
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;
        const { status } = req.query;
        let filter = { $and: [{ customer: customerId }] };
        if (status) {
            filter.$and.push({ status });
        }
        // const payments = await PaymentHistory.find({ user: userId })
        //   .populate("course") // Optional: show course title and price
        //   .sort({ createdAt: -1 });
        const [payments, total] = await Promise.all([
            PaymentHistory.find(filter)
                .select("customer customerModel course reference type transactionId transactionType amount status createdAt")
                .populate("course")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            PaymentHistory.countDocuments(filter),
        ]);
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Payment history fetched",
            data: payments,
            page,
            totalTransactionPerPage: payments.length,
            totalTransactions: total,
            totalPages: Math.ceil(total / Number(limit)),
        });
    }
    catch (error) {
        console.error("Error getting payment history:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const getSinglePaymentHistory = async (req, res) => {
    try {
        const { customerModel } = req.query;
        let customerId;
        if (customerModel === "Tutor") {
            customerId = req.tutor?.tutorId;
        }
        else if (customerModel === "Affiliate") {
            customerId = req.affiliate?.affiliateId;
        }
        else if (customerModel === "User") {
            customerId = req.user?.userId;
        }
        else {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid Customer Model",
            });
        }
        if (!customerId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: `${customerModel} Id can't be empty`,
            });
        }
        const { paymentHistoryId } = req.params;
        const payment = await PaymentHistory.findOne({
            _id: paymentHistoryId,
            customer: customerId,
            customerModel,
        }).populate("course");
        if (!payment) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Payment record not found",
            });
        }
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Payment record fetched successfully",
            data: payment,
        });
    }
    catch (error) {
        console.error("Error getting payment history by ID:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export { getAllPaymentHistory, getSinglePaymentHistory };
