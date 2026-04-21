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
  payWithExistingBankMethod,
} from "../services/index.js";

console.log("PAYSTACK KEY:", process.env.PAYSTACK_SECRET_KEY);
const displayCard = (last4: string, bin: string) => {
  return `${bin.slice(0, 4)} **** **** **** ${last4}`;
};

const paystackWebhook = async (req: Request, res: Response): Promise<any> => {
  console.log("🔥 WEBHOOK HIT"); // ✅ FIRST LINE
  console.log("Headers:", req.headers); // ✅ ADD THIS
  console.log("Raw Body:", req.body);   // ✅ ADD THIS
  console.log(req.body);
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
      console.log("❌ Missing payload");
      return res.sendStatus(400);
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", secret!)
      .update(payload)
      .digest("hex");
    console.log("Generated hash:", hash);
    console.log("Paystack signature:", sig);

    if (hash !== sig) {
      console.log("❌ Invalid signature");
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Invalid signature" });
    }

    // Parse JSON payload after verifying signature
    // const event = JSON.parse(payload.toString());
    // console.log("Received Paystack event:", event);
    // console.log("Event type:", event.event);
    // console.log("Event data:", event.data);
    // console.log("Event metadata:", event.data.metadata);
    // console.log("Event reference:", event.data.reference);
    let event: any;
    try {
      event = JSON.parse(payload.toString());
    } catch (err) {
      console.error("Webhook JSON parse failed:", err);
      return res.sendStatus(400);
    }

    // Handle the event based on its type
    // ===== Trust webhook first =====
    const data = event.data;
    const metadata = data?.metadata;
    const status = data?.status; // success, failed, abandoned
    const reference = data?.reference;

    // ===== Safe verify (fallback) =====
    const verifyData = await PaystackVerify(event.data.reference);
    const verifiedStatus = verifyData?.status || status;

    // Always log the attempt
    await PaymentHistory.create({
      customer: metadata.id,
      customerModel: metadata.customerModel || "User",
      course: metadata?.courseId || null,
      reference,
      amount: data.amount / 100,
      currency: data.currency,
      type: "debit",
      transactionId: data.id,
      transactionType: metadata.transactionType || "course_payment",
      status: verifiedStatus,
      bank: data.authorization.bank,
      cardType: data.authorization.card_type,
      channel: data.authorization.channel,
      gatewayResponse: data.gateway_response,
      paidAt: data.paid_at,
      ipAddress: data.ip_address,
    });

    if (event.event === "charge.success" && verifiedStatus === "success") {
      if (metadata.purpose === "card_tokenization") {
        const customerId = metadata.id;
        const existingMethods = await PaymentMethod.find({
          customer: customerId,
        });
        const isFirst = existingMethods.length === 0;

        if (data.authorization.reusable) {
          await PaymentMethod.create({
            customer: customerId,
            customerModel: metadata.customerModel,
            authorizationCode: data.authorization.authorization_code,
            bin: data.authorization.bin,
            lastFour: data.authorization.last4,
            expMonth: data.authorization.exp_month,
            expYear: data.authorization.exp_year,
            bank: data.authorization.bank,
            cardType: data.authorization.card_type,
            cardHolderName: data.authorization.account_name,
            isDefault: isFirst,
          });
        }

        // console.log(`Card tokenized for user ${customerId}`);

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
      } else if (metadata.purpose === "course_payment") {
        await PurchasedCourse.create({
          customer: metadata.id,
          course: metadata.courseId,
          purchasedAt: data.paid_at,
          isCompleted: true,
          paymentReference: reference,
          transactionId: data.id,
          authorizationCode: data.authorization.authorization_code,
          amountPaid: data.amount / 100,
        });
      }

      // You can handle other purposes here, e.g., course_purchase, wallet_topup, etc.
    }

    // Handle failure
    if (status === "failed" || verifiedStatus === "failed") {
      console.warn("Payment failed:", reference);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};

const addPaymentMethod = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;
    const callback_url = "https://google.com";

    // Always charge ₦100 for tokenization
    const amount = 100;

    // Initialize payment for tokenization
    const { authorization_url, reference } = await InitializePayment(
      userId!,
      email!,
      amount,
      "card_tokenization",
      "User",
      "", // ✅ EMPTY STRING
      {},
      "https://google.com" // ✅ TEST URL
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
    const { methodId } = req.params;

    await PaymentMethod.updateMany({ customer: userId }, { isDefault: false });

    const updated = await PaymentMethod.findOneAndUpdate(
      { _id: methodId, customer: userId },
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
    const { methodId } = req.params;
    const userId = req.user?.userId;

    const deleted = await PaymentMethod.findOneAndDelete({
      _id: methodId,
      customer: userId,
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
    const methods = await PaymentMethod.find({ customer: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    // Map through and format card numbers
    const formattedMethods = methods.map((method) => {
      return {
        // ...method.toObject(),
        _id: method._id,
        // customer: method.customer,
        expMonth: method.expMonth,
        expYear: method.expYear,
        bank: method.bank,
        cardType: method.cardType,
        isDefault: method.isDefault,
        // cardHolderName: method.cardHolderName,
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
    const { courseId, paymentMethodId } = req.body;
    const userId = req.user?.userId;
    const email = req.user?.email;

    if (!courseId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Missing or course ID.",
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

    if (paymentMethodId) {
      // === Pay with saved card ===
      const paymentMethod = await PaymentMethod.findById(paymentMethodId);
      if (!paymentMethod) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Saved payment method not found.",
        });
      }

      const response = await payWithExistingBankMethod(
        paymentMethod.authorizationCode,
        email!,
        coursePriceInKobo,
        courseId,
        userId!,
        "course_payment"
      );

      console.log("Course payment:", response);

      if (!response.status) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: response.message || "Payment failed.",
        });
      }

      const courseData = {
        transaction_id: response.data.id,
        reference: response.data.reference,
      };

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Course payment successful",
        data: courseData,
      });
    } else {
      const callback_url =
        req.headers?.origin || "https://google.com";

      // Always charge ₦100 for tokenization
      const amount = Number(course.priceInNaira);

      // Initialize payment for tokenization
      const { authorization_url, reference } = await InitializePayment(
        userId!,
        email!,
        amount,
        "course_payment",
        "User",
        "", // ✅ EMPTY STRING (FIX)
        {},
        "https://google.com", // ✅ TEST URL
        courseId
      );

      const courseData = {
        authorization_url,
        reference,
      };

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Course payment initialized",
        data: courseData,
      });
    }
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
