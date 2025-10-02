import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import BankPaymentMethod from "../models/BankPaymentMethod.js";
import Tutor, { ITutor } from "../models/Tutor.js";
import Affiliate, { IAffiliate } from "../models/Affiliate.js";
import PendingTransfer from "../models/PendingTransfer.js";
import { hashAccountNumber } from "../utils/index.js";
import {
  PaystackTokenizeBank,
  getAccountName,
  initiateWithdrawal,
  finalizeTransfer,
} from "../services/index.js";
import { TokenGenerator } from "../helpers/index.js";
import { sendPaymentVerificationEmail } from "../utils/index.js";
// import { trusted } from "mongoose";

const verifyAndTokenizeBankAccount = async (
  accountName: string,
  accountNumber: string,
  bankCode: string,
  customerId: string,
  customerModel: "Tutor" | "Affiliate"
) => {
  const accountHash = hashAccountNumber(accountNumber);
  const account = await BankPaymentMethod.findOne({
    customer: customerId,
    accountHash,
  });

  if (account) {
    throw new Error("Bank account already saved");
  }

  const tokenized = await PaystackTokenizeBank(
    accountName,
    accountNumber,
    bankCode,
    customerId,
    customerModel
  );

  if (!tokenized) {
    throw new Error("Unable to tokenize bank account");
  }

  console.log(tokenized);

  // Save to DB (encrypted if you want)
  const paymentMethod = await BankPaymentMethod.create({
    customer: customerId,
    customerModel,
    type: "bank",
    recipientCode: tokenized.recipientCode,
    bankName: tokenized.bankName,
    accountNumber: tokenized.accountNumber,
    accountName: tokenized.accountName,
  });

  return paymentMethod;
};

const accountName = async (req: Request, res: Response): Promise<any> => {
  try {
    const { accountNumber, bankCode } = req.body;
    const account = await getAccountName(accountNumber, bankCode);

    if (!account) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: true,
        message: "Account not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Account name gotten successfully",
      data: account,
    });
  } catch (error: any) {
    console.error("Error getting account name:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const addBankAccount = async (req: Request, res: Response): Promise<any> => {
  try {
    const { accountName, accountNumber, bankCode, customerModel } = req.body;

    if (!accountName || !accountNumber || !bankCode || !customerModel) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }

    let customerId;
    if (customerModel === "Tutor") {
      customerId = req.tutor?.tutorId;
    } else if (customerModel === "Affiliate") {
      customerId = req.affiliate?.affiliateId;
    } else {
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

    const bankAccount = await verifyAndTokenizeBankAccount(
      accountName,
      accountNumber,
      bankCode,
      customerId!,
      customerModel
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Bank account tokenized successfully",
      data: bankAccount,
    });
  } catch (error: any) {
    console.error("Error adding bank account:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Internal Server Error",
    });
  }
};

const getAllBankPaymentMethods = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const customerModel = req.query.customerModel as "Tutor" | "Affiliate";

    let customerId;
    if (customerModel === "Tutor") {
      customerId = req.tutor?.tutorId;
    } else if (customerModel === "Affiliate") {
      customerId = req.affiliate?.affiliateId;
    } else {
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

    const methods = await BankPaymentMethod.find({
      customer: customerId,
      customerModel,
    }).sort({ createdAt: -1, isDefault: -1 });

    if (!methods.length) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No bank payment methods found",
        bankDetails: [],
      });
    }

    const bankDetails = methods.map((bank) => ({
      // ...bank.toObject(),
      _id: bank._id,
      bankName: bank.bankName,
      accountNumber: bank.decryptAccountNumber(),
      accountName: bank.decryptAccountName(),
      isDefault: bank.isDefault,
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      bankDetails,
    });
  } catch (error: any) {
    console.error("Error getting all payment method", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deletePaymentMethod = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { customerModel } = req.body;
    const { methodId } = req.params;

    let customerId;
    if (customerModel === "Tutor") {
      customerId = req.tutor?.tutorId;
    } else if (customerModel === "Affiliate") {
      customerId = req.affiliate?.affiliateId;
    } else {
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
    const deleted = await BankPaymentMethod.findOneAndDelete({
      _id: methodId,
      customer: customerId,
      customerModel,
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

const withdrawalFromBalance = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { amount, customerModel, bankPaymentMethodId } = req.body;
    if (
      typeof amount !== "number" ||
      !customerModel ||
      !["Tutor", "Affiliate"].includes(customerModel) ||
      !bankPaymentMethodId
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "All fields are required" });
    }

    let customerId;
    if (customerModel === "Tutor") {
      customerId = req.tutor?.tutorId;
    } else if (customerModel === "Affiliate") {
      customerId = req.affiliate?.affiliateId;
    } else {
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

    const bankPaymentMethod = await BankPaymentMethod.findById(
      bankPaymentMethodId
    );
    if (!bankPaymentMethod) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Bank not found" });
    }
    const accountNumber = bankPaymentMethod.decryptAccountNumber();

    // Check balance first
    const customer =
      customerModel === "Tutor"
        ? await Tutor.findById(customerId)
        : await Affiliate.findById(customerId);

    if (!customer || customer.balance < amount) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Insufficient balance" });
    }

    // Generate OTP
    const {
      finalVerificationToken,
      verificationToken,
      // verificationTokenExpirationDate,
    } = await TokenGenerator();

    // Store pending transfer
    const pending = await PendingTransfer.create({
      customer: customerId,
      customerModel,
      amount,
      recipientCode: bankPaymentMethod.recipientCode,
      verificationToken: finalVerificationToken,
      verificationTokenExpirationDate: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      verificationResendAttempts: 1,
      status: "pending_otp",
    });

    const fName =
      customerModel === "Tutor"
        ? (customer as ITutor).fName
        : (customer as IAffiliate).firstName;

    await sendPaymentVerificationEmail({
      email: customer.email,
      verificationToken,
      amount,
      fName,
      accountNumber,
      bankName: bankPaymentMethod.bankName,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP sent to your email. Confirm to proceed.",
      pendingId: pending._id,
    });
  } catch (error: any) {
    console.error("Error withdrawing to bank account:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const confirmWithdrawal = async (req: Request, res: Response): Promise<any> => {
  const { pendingId } = req.params;
  const { verificationToken, customerModel } = req.body;

  if (!pendingId || !verificationToken || !customerModel) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      messgage: "All fields required",
    });
  }

  try {
    const response = await initiateWithdrawal(
      pendingId,
      customerModel,
      verificationToken
    );

    res.json({
      success: response.success,
      message: response.message,
      data: response.data,
    });
  } catch (error: any) {
    console.error("Error confirming withdrawal:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const resendWithdrawalOtp = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { pendingId } = req.params;

    const pending = await PendingTransfer.findById(pendingId);
    if (!pending) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Pending transfer not found" });
    }

    if (pending.status !== "pending_otp") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Transfer is not awaiting OTP" });
    }

    if (pending.verificationResendAttempts > 4) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "You can't request otp for a single transaction more than 3 times",
      });
    }

    const bankPaymentMethod = await BankPaymentMethod.findOne({
      customer: pending.customer,
      customerModel: pending.customerModel,
      recipientCode: pending.recipientCode,
    });
    if (!bankPaymentMethod) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Bank not found" });
    }

    const customerId =
      pending.customerModel === "Tutor"
        ? req.tutor?.tutorId
        : req.affiliate?.affiliateId;

    // Check balance first
    const customer =
      pending.customerModel === "Tutor"
        ? await Tutor.findById(customerId)
        : await Affiliate.findById(customerId);

    const fName =
      pending.customerModel === "Tutor"
        ? (customer as ITutor).fName
        : (customer as IAffiliate).firstName;

    if (!customer || !fName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "First name and email required",
      });
    }

    const { finalVerificationToken, verificationToken } =
      await TokenGenerator();

    // generate new OTP + expiry
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    pending.verificationToken = finalVerificationToken;
    pending.verificationTokenExpirationDate = otpExpiresAt;
    pending.verificationResendAttempts += 1;
    await pending.save();

    // send OTP again (email, sms etc.)
    await sendPaymentVerificationEmail({
      email: customer?.email,
      verificationToken,
      amount: pending.amount,
      fName,
      accountNumber: bankPaymentMethod.decryptAccountNumber(),
      bankName: bankPaymentMethod.bankName,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "A new OTP has been sent to your email.",
      pendingId: pending._id,
    });
  } catch (error: any) {
    console.error("Error resending withdrawal otp:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// const finalizePaymentWithdrawal = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { transferCode, otp, customerId, customerModel } = req.body;
//     if (!transferCode || !otp || !customerId || !customerModel) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const response = await finalizeTransfer(transferCode, otp);

//     res.status(StatusCodes.OK).json({
//       success: response.status,
//       message: response.message,
//       data: response.data,
//     });
//   } catch (error: any) {
//     console.error("Error finalizing withdrawal payment", error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

export {
  accountName,
  addBankAccount,
  getAllBankPaymentMethods,
  deletePaymentMethod,
  withdrawalFromBalance,
  confirmWithdrawal,
  resendWithdrawalOtp,
};
