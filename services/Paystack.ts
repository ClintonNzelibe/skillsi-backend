import axios from "axios";
import PaymentHistory from "../models/PaymentHistory.js";
import { PAYSTACK_SECRET_KEY } from "../utils/index.js";

export const InitializePayment = async (
  id: string,
  email: string,
  amount: number,
  purpose: string,
  customerModel: "User" | "Admin" | "Affiliate" | string,
  callbackPath: string,
  extraMetadata: Record<string, any> = {}
): Promise<{ authorization_url: string; reference: string }> => {
  if (!email || !amount || !purpose) {
    throw new Error("Email, amount, and purpose are required");
  }
  const callback_url = `${process.env.CLIENT_URL}${
    callbackPath || "/payment/callback"
  }`;

  const amountInKobo = amount * 100; // Paystack expects kobo

  // 👇 channels logic
  const channels =
    purpose === "card_tokenization"
      ? ["card"] // only card allowed
      : ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]; // allow all channels

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email,
      amount: amountInKobo,
      callback_url,
      ...(channels && { channels }),
      metadata: {
        id,
        purpose,
        customerModel,
        transactionType: purpose,
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

export const PaystackRefund = async (reference: string, customerId: string) => {
  const response = await axios.post(
    "https://api.paystack.co/refund",
    { transaction: reference }, // can also be transaction ID
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const refundData = response.data.data;
  const paymentData = refundData.authorization;

  // Store refund in PaymentHistory
  await PaymentHistory.create({
    customer: customerId,
    customerModel: refundData.metadata.customerModel || "User",
    reference: refundData.reference,
    amount: refundData.amount,
    currency: refundData.currency || "NGN",
    type: "refund",
    transactionId: refundData.id,
    transactionType: "card_tokenization",
    status: refundData.status === "processed" ? "success" : "pending",
    bank: paymentData.bank,
    cardType: paymentData.card_type,
    gatewayResponse: refundData.gateway_response,
    channel: paymentData.channel,
    paidAt: paymentData.paid_at,
    ipAddress: refundData.ip_address,
  });

  return refundData;
};

export const PaystackVerify = async (reference: string) => {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data;
};
