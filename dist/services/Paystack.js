import axios from "axios";
import PaymentHistory from "../models/PaymentHistory.js";
import Tutor from "../models/Tutor.js";
import Affiliate from "../models/Affiliate.js";
import PendingTransfer from "../models/PendingTransfer.js";
import { createHash } from "../utils/index.js";
const paystack = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        // "User-Agent": "skillsi",
    },
    timeout: 600000,
});
export const InitializePayment = async (id, email, amount, purpose, customerModel, callbackPath, extraMetadata = {}, callbackUrl, courseId) => {
    if (!email || !amount || !purpose) {
        throw new Error("Email, amount, and purpose are required");
    }
    const callback_url = callbackUrl || "https://google.com";
    const amountInKobo = amount * 100; // Paystack expects kobo
    // 👇 channels logic
    const channels = purpose === "card_tokenization"
        ? ["card"] // only card allowed
        : ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]; // allow all channels
    const response = await paystack.post("/transaction/initialize", {
        email,
        amount: amountInKobo,
        callback_url,
        ...(channels && { channels }),
        metadata: {
            id,
            courseId,
            purpose,
            customerModel,
            transactionType: purpose,
            ...extraMetadata, // can include courseId, tutorId, etc.
        },
    });
    const { authorization_url, reference } = response.data.data;
    return { authorization_url, reference };
};
export const PaystackRefund = async (reference, customerId) => {
    const response = await paystack.post("/refund", { transaction: reference });
    const refundData = response.data.data;
    const paymentData = refundData.authorization;
    console.log("Refund Data: ", refundData, "Payment Data:", paymentData);
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
export const PaystackVerify = async (reference) => {
    try {
        const response = await paystack.get(`https://api.paystack.co/transaction/verify/${reference}`);
        return response.data.data;
    }
    catch (error) {
        console.error("Paystack verify failed:", error.response?.data || error.message);
        throw new Error(error.response?.data ||
            error.message ||
            error?.response?.data?.message ||
            "Error tokenizing bank account");
    }
};
/**
 * Tokenize a bank account with Paystack
 */
export const PaystackTokenizeBank = async (accountName, accountNumber, bankCode, customerId, customerModel) => {
    try {
        const { data } = await paystack.post("/transferrecipient", {
            type: "nuban",
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode, // e.g. "058" for GTBank
            currency: "NGN",
            metadata: {
                customerId,
                customerModel,
            },
        });
        if (!data.status) {
            throw new Error(data.message || "Failed to tokenize bank account");
        }
        return {
            recipientCode: data.data.recipient_code,
            accountName: data.data.details.account_name,
            accountNumber: data.data.details.account_number,
            bankName: data.data.details.bank_name,
            customerId,
            customerModel,
        };
    }
    catch (error) {
        console.error("Paystack bank tokenization error:", error?.response?.data || error.message);
        throw new Error(error?.response?.data?.message || "Error tokenizing bank account");
    }
};
export const getAccountName = async (accountNumber, bankCode) => {
    try {
        const response = await paystack.get(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
        return response.data.data;
    }
    catch (error) {
        console.error("Paystack getting account name error:", error);
        throw new Error(error?.response?.data?.message || "Error getting account name");
    }
};
export const payWithExistingBankMethod = async (authorizationCode, email, coursePriceInKobo, courseId, userId, purpose) => {
    try {
        // Call Paystack to charge authorization
        const response = await paystack.post("/transaction/charge_authorization", {
            authorization_code: authorizationCode,
            email, // must be provided
            amount: coursePriceInKobo,
            currency: "NGN",
            metadata: {
                id: userId,
                courseId,
                purpose,
                customerModel: "User",
                transactionType: purpose,
            },
        });
        return response.data;
    }
    catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};
export const initiateWithdrawal = async (pendingId, customerModel, verificationToken
// transactionType: string
) => {
    //   const session = await mongoose.startSession();
    // session.startTransaction();
    // start withdrawal flow
    let session;
    if (customerModel === "Tutor") {
        session = await Tutor.startSession();
    }
    else {
        session = await Affiliate.startSession();
    }
    session.startTransaction();
    try {
        const pending = await PendingTransfer.findById(pendingId).session(session);
        if (!pending)
            throw new Error("Pending withdrawal not found");
        if (pending.verificationToken !== createHash(verificationToken) ||
            pending.verificationTokenExpirationDate < new Date()) {
            throw new Error("Invalid or expired OTP");
        }
        // 1. Find user
        let customer;
        if (customerModel === "Tutor") {
            customer = await Tutor.findById(pending.customer).session(session);
        }
        else if (customerModel === "Affiliate") {
            customer = await Affiliate.findById(pending.customer).session(session);
        }
        else {
            throw new Error("Invalid Customer Model");
        }
        // Check balance first
        // const customer =
        //   customerModel === "Tutor"
        //     ? await Tutor.findById(customerId)
        //     : await Affiliate.findById(customerId);
        if (!customer)
            throw new Error(`${customerModel} not found`);
        // 2. Check balance
        if (customer.balance < pending.amount) {
            throw new Error("Insufficient balance");
        }
        // 3. Deduct balance first
        customer.balance -= pending.amount;
        await customer.save({ session });
        // 4. Call Paystack initiate transfer
        const response = await paystack.post("/transfer", {
            source: "balance",
            reason: "Withdrawal",
            amount: pending.amount * 100, // Paystack expects kobo
            recipient: pending.recipientCode,
        });
        const transferData = response.data.data;
        // const paymentData = transferData.authorization;
        // 5. Optionally record transaction
        await PaymentHistory.create({
            customer: pending.customer,
            customerModel: pending.customerModel,
            amount: pending.amount,
            currency: transferData.currency || "NGN",
            type: "debit",
            status: transferData.status === "processed" ? "success" : "pending",
            reference: transferData.reference,
            transactionId: transferData.id,
            transactionType: pending.customerModel === "Tutor"
                ? "tutor_withdrawal"
                : "affiliate_withdrawal",
            bank: transferData.recipient?.details?.bank_name || "bank",
            gatewayResponse: transferData.gateway_response,
            ipAddress: transferData.ip_address,
            channel: "bank_transfer",
            paidAt: transferData.createdAt,
        });
        // { session }
        // Mark pending as processed
        pending.status = "processing";
        pending.transferCode = transferData.transfer_code;
        await pending.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            success: true,
            message: "Withdrawal initiated successfully",
            data: response.data.data,
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new Error(error.response?.data?.message || error.message);
    }
};
export const finalizeTransfer = async (transferCode, otp) => {
    try {
        const response = await paystack.post("/transfer/finalize_transfer", {
            transfer_code: transferCode,
            otp,
        });
        return response.data;
    }
    catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};
