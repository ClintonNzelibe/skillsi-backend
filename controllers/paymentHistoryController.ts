import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import PaymentHistory from "../models/PaymentHistory.js";

const getAllPaymentHistoryUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    let filter: any = { $and: [{ user: userId }] };

    if (status) {
      filter.$and.push({ status });
    }

    // const payments = await PaymentHistory.find({ user: userId })
    //   .populate("course") // Optional: show course title and price
    //   .sort({ createdAt: -1 });

    const [payments, total] = await Promise.all([
      PaymentHistory.find(filter)
        .select("user course reference transactionId amount status")
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
  } catch (error) {
    console.error("Error getting payment history:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getSinglePaymentHistoryUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const payment = await PaymentHistory.findOne({
      _id: id,
      user: userId,
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
  } catch (error) {
    console.error("Error getting payment history by ID:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export { getAllPaymentHistoryUser, getSinglePaymentHistoryUser };
