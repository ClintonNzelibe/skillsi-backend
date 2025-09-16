import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import PaymentMethod from "../models/PaymentMethod.js";
import Course from "../models/Course.js";
import PurchasedCourse from "../models/PurchasedCourse.js";
import PaymentHistory from "../models/PaymentHistory.js";
import crypto from "crypto";
import { PAYSTACK_SECRET_KEY } from "../utils/index.js";
import {
  InitializePayment,
  PaystackRefund,
  PaystackVerify,
} from "../services/index.js";

const displayCard = (last4: string, bin: string) => {
  return `${bin.slice(0, 4)} **** **** **** ${last4}`;
};

const paystackWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    const secret = PAYSTACK_SECRET_KEY;

    if (!secret) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Paystack secret key not configured",
      });
    }

    const sig = req.headers["x-paystack-signature"] as string;
    // With express.raw middleware, req.body should already be a Buffer

    if (!sig) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Missing Stripe Signature" });
    }

    const payload = req.body;

    if (!payload) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Missing payload" });
    }
    if (typeof payload === "string" || !Buffer.isBuffer(payload)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Payload must be a Buffer" });
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", secret!)
      .update(payload)
      .digest("hex");

    if (hash !== sig) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Invalid signature" });
    }

    // Parse JSON payload after verifying signature
    const event = JSON.parse(payload.toString());
    console.log("Received Paystack event:", event);
    console.log("Event type:", event.event);
    console.log("Event data:", event.data);
    console.log("Event metadata:", event.data.metadata);
    console.log("Event reference:", event.data.reference);
    // Handle the event based on its type
    if (event.event === "charge.success") {
      const metadata = event.data.metadata;
      const purpose = metadata?.purpose;

      if (purpose === "card_tokenization") {
        const customerId = metadata.id;
        const priceInKobo = 100 * 100; // ₦100 in kobo
        const reference = event.data.reference;

        const existingPaymentMethods = await PaymentMethod.find({
          user: customerId,
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
          cardHolderName,
          customerModel,
        } = await verifyAndTokenizeCard(reference, priceInKobo, customerId);

        await PaymentMethod.create({
          customer: customerId,
          customerModel,
          authorizationCode,
          bin,
          lastFour,
          expMonth,
          expYear,
          bank,
          cardType,
          cardHolderName,
          isDefault: isFirstPaymentMethod,
        });

        console.log(`Card tokenized for user ${customerId}`);

        // Immediately refund the ₦100 charge
        try {
          const refundResponse = await PaystackRefund(reference, customerId);
          console.log("Refund processed:", refundResponse);
        } catch (refundError: any) {
          console.error(
            "Refund failed:",
            refundError.response?.data || refundError
          );
        }
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
  customerId: string,
  courseId?: string
) => {
  const data = await PaystackVerify(reference);

  const paymentStatus = data.status;
  const paymentData = data.authorization;

  console.log("Complete data:", data, "Payment status:", paymentStatus);

  // Always log the attempt
  await PaymentHistory.create({
    customer: customerId,
    customerModel: data.metadata.customerModel || "User",
    course: courseId,
    reference,
    amount: data.amount,
    currency: paymentData.currency,
    type: "debit",
    transactionId: data.id,
    transactionType: data.metadata.transactionType || "course_payment",
    status: paymentStatus,
    bank: paymentData.bank,
    cardType: paymentData.card_type,
    gatewayResponse: data.gateway_response,
    channel: paymentData.channel,
    paidAt: paymentData.paid_at,
    ipAddress: data.ip_address,
  });

  // ✅ Check if the transaction was successful
  if (data.status !== "success") {
    throw new Error("Transaction was not successful");
  }

  // ✅ Validate amount
  if (data.amount !== expectedAmount) {
    throw new Error("Incorrect payment amount");
  }

  const { authorization, id: transactionId, metadata } = data;

  if (!authorization?.reusable) {
    throw new Error("Card not reusable");
  }

  console.log(authorization, transactionId);

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
      cardHolderName: authorization.account_name || "Unknown",
      customerModel: metadata.customerModel || "User",
      transactionType: metadata.transactionType || "course_payment",
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
    const { authorization_url, reference } = await InitializePayment(
      userId!,
      email!,
      amount,
      "card_tokenization",
      "User",
      "/payment/callback",
      {}
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Payment method added successfully",
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

export {
  paystackWebhook,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  coursePayment,
};
