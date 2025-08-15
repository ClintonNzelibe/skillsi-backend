import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import PaymentMethod from "../models/PaymentMethod.js";
import Course from "../models/Course.js";
import PurchasedCourse from "../models/PurchasedCourse.js";
import PaymentHistory from "../models/PaymentHistory.js";
import axios from "axios";
import crypto from "crypto";

const PAYSTACK_SECRET_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.PAYSTACK_SECRET_LIVE_KEY
    : process.env.PAYSTACK_SECRET_TEST_KEY || "";

const displayCard = (last4: string, bin: string) => {
  return `${bin.slice(0, 4)} **** **** **** ${last4}`;
};

const initializePayment = async (
  id: string,
  email: string,
  amount: number,
  purpose: string,
  callbackPath: string,
  extraMetadata: Record<string, any> = {}
): Promise<{ authorization_url: string; reference: string }> => {
  if (!email || !amount || !purpose) {
    throw new Error("Email, amount, and purpose are required");
  }

  const amountInKobo = amount * 100; // Paystack expects kobo

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email,
      amount: amountInKobo,
      callback_url: `${process.env.CLIENT_URL}${
        callbackPath || "/payment/callback"
      }`,
      metadata: {
        id,
        purpose,
        ...extraMetadata, // can include courseId, tutorId, etc.
      },
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const { authorization_url, reference } = response.data.data;

  return { authorization_url, reference };
};

const paystackWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    const secret = PAYSTACK_SECRET_KEY

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", secret!)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;
    if (event.event === "charge.success") {
      const metadata = event.data.metadata;
      const purpose = metadata?.purpose;

      if (purpose === "card_tokenization") {
        const userId = metadata.id;
        const priceInKobo = 100 * 100; // ₦100 in kobo
        const reference = event.data.reference;

        const existingPaymentMethods = await PaymentMethod.find({
          user: userId,
        });
        const isFirstPaymentMethod = existingPaymentMethods.length === 0;

        // Tokenize card
        const {
          transactionId,
          authorizationCode,
          bin,
          lastFour,
          expMonth,
          expYear,
          bank,
          cardType,
        } = await verifyAndTokenizeCard(reference, priceInKobo, userId);

        await PaymentMethod.create({
          user: userId,
          authorizationCode,
          bin,
          lastFour,
          expMonth,
          expYear,
          bank,
          cardType,
          isDefault: isFirstPaymentMethod,
        });

        console.log(`Card tokenized for user ${userId}`);
      }

      // You can handle other purposes here, e.g., course_purchase, wallet_topup, etc.
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};

const verifyAndTokenizeCard = async (
  reference: string,
  expectedAmount: number,
  userId: string,
  courseId?: string
) => {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = response.data.data;
  const paymentStatus = data.status;

  // Always log the attempt
  await PaymentHistory.create({
    user: userId,
    course: courseId,
    reference,
    transactionId: data.id,
    amount: data.amount,
    status: paymentStatus,
    bank: data.bank,
    cardType: data.card_type,
    gatewayResponse: data.gateway_response,
    channel: data.channel,
    currency: data.currency,
    paidAt: data.paid_at,
  });

  // ✅ Check if the transaction was successful
  if (data.status !== "success") {
    throw new Error("Transaction was not successful");
  }

  // ✅ Validate amount
  if (data.amount !== expectedAmount) {
    throw new Error("Incorrect payment amount");
  }

  const { authorization, id: transactionId } = data;

  if (!authorization?.reusable) {
    throw new Error("Card not reusable");
  }

  if (authorization.reusable) {
    // Save reusable card authorization_code
    return {
      transactionId, // include this
      authorizationCode: authorization.authorization_code,
      bin: authorization.bin,
      lastFour: authorization.last4,
      expMonth: authorization.exp_month,
      expYear: authorization.exp_year,
      bank: authorization.bank,
      cardType: authorization.card_type,
    };
  }

  throw new Error("Card not reusable");
};

const addPaymentMethod = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;

    // Always charge ₦100 for tokenization
    const amount = 100;

    // Initialize payment for tokenization
    const { authorization_url, reference } = await initializePayment(
      userId!,
      email!,
      amount,
      "card_tokenization",
      "/payment/callback",
      {}
    );

    res.status(StatusCodes.OK).json({
      success: true,
      authorization_url,
      reference,
    });
  } catch (error) {
    console.error("Error adding payment method:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const setDefaultPaymentMethod = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const methodId = req.params.id;

    await PaymentMethod.updateMany({ user: userId }, { isDefault: false });

    const updated = await PaymentMethod.findOneAndUpdate(
      { _id: methodId, user: userId },
      { isDefault: true },
      { new: true }
    );

    if (!updated) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Method not found" });
    }

    res.status(StatusCodes.OK).json({
      sucess: true,
      message: "Payment method set to default successfully",
      defaultMethod: updated,
    });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const deletePaymentMethod = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const methodId = req.params.id;
    const userId = req.user?.userId;

    const deleted = await PaymentMethod.findOneAndDelete({
      _id: methodId,
      user: userId,
    });

    if (!deleted) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Payment Method not found" });
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getAllPaymentMethods = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId;

    // Fetch all methods, default first, then by createdAt descending
    const methods = await PaymentMethod.find({ user: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    // Map through and format card numbers
    const formattedMethods = methods.map((method) => {
      return {
        ...method.toObject(),
        formattedCardNumber: displayCard(method.lastFour, method.bin),
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      cardDetails: formattedMethods,
    });
  } catch (error) {
    console.error("Error getting payment method:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const coursePayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reference, courseId } = req.body;
    const userId = req.user?.userId;

    if (!reference || !courseId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Missing payment reference or course ID.",
      });
    }

    // Fetch course and its price
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found.",
      });
    }

    // const coursePriceInKobo = course.priceInNaira * 100;
    const coursePriceInKobo = Number(course.priceInNaira) * 100;

    // Reuse the verify and tokenize logic
    const paymentDetails = await verifyAndTokenizeCard(
      reference,
      coursePriceInKobo,
      courseId,
      userId
    );

    // Save or update user-course enrollment/payment record here
    await PurchasedCourse.create({
      user: userId,
      course: courseId,
      purchasedAt: new Date(),
      isCompleted: true,
      paymentReference: reference,
      transactionId: paymentDetails.transactionId,
      authorizationCode: paymentDetails.authorizationCode,
      amountPaid: course.priceInNaira,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course payment successful",
    });
  } catch (error) {
    console.error("Error making payment for the course:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

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
      totalPerPage: payments.length,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
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

export {
  paystackWebhook,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  coursePayment,
  getAllPaymentHistoryUser,
  getSinglePaymentHistoryUser,
};
