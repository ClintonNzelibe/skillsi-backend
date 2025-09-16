import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import BankPaymentMethod from "../models/BankPaymentMethod.js";
import { hashAccountNumber } from "../utils/index.js";
import {
  PaystackTokenizeBank,
  getAccountName,
  initiateWithdrawal,
  finalizeTransfer
} from "../services/index.js";
import { trusted } from "mongoose";

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

const withdrawalFromBalance = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // const { bankPaymentMethodId } = req.params;
    const { amount, customerModel, bankPaymentMethodId } = req.body;
    if (typeof amount !== "number" || !customerModel || !bankPaymentMethodId) {
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

    const bankPaymentMethod = await BankPaymentMethod.findById(
      bankPaymentMethodId
    );

    const response = await initiateWithdrawal(
      bankPaymentMethod?.recipientCode!,
      amount,
      customerId!,
      customerModel,
      bankPaymentMethod?.bankName || "bank"
    );

    res.status(StatusCodes.OK).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });
  } catch (error: any) {
    console.error("Error withdrawing to bank account:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getAllBankPaymentMethods = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const customerModel = req.query.customerModel as "Tutor" | "Affiliate";

    console.log(customerModel);

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
      ...bank.toObject(),
      accountNumber: bank.decryptAccountNumber(),
      accountName: bank.decryptAccountName(),
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
  addBankAccount,
  accountName,
  withdrawalFromBalance,
  getAllBankPaymentMethods,
};
