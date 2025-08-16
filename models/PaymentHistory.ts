import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPaymentHistory extends Document {
  customer: Types.ObjectId;
  course?: Types.ObjectId;
  transactionType: "card_tokenization"
    | "course_payment"
    | "tutor_withdrawal"
    | "affiliate_withdrawal";
  customerModel: "User" | "Admin" | "Affiliate";
  reference: string;
  type: "credit" | "debit" | "refund";
  transactionId?: string;
  amount: number;
  currency: "NGN" | "USD" | "EUR" | "GBP";
  status: "pending" | "success" | "failed";
  bank: string;
  cardType: string;
  gatewayResponse?: string;
  channel?: string;
  paidAt?: Date;
  ipAddress?: string;
}

const PaymentHistorySchema: Schema<IPaymentHistory> = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
      refPath: "customerModel",
      required: [true, "Please provider user id"],
    },
    customerModel: {
      type: String,
      required: true,
      enum: ["User", "Admin", "Affiliate"], // models it can point to
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      //   required: [true, "Please provider user id"],
    },
    reference: {
      type: String,
      required: [true, "Please provide payment reference"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit", "refund"],
      default: "credit",
    },
    transactionId: {
      type: String,
      required: [true, "Please provide transaction id"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Please provide amount"],
    },
    currency: {
      type: String,
      enum: ["NGN", "USD", "EUR", "GBP"],
      required: [true, "Please provide currency"],
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    bank: {
      type: String,
      required: function () {
        return this.channel === "card";
      },
      default: "",
    },
    cardType: {
      type: String,
      required: function () {
        return this.channel === "card";
      },
      default: "",
    },
    gatewayResponse: { type: String, default: "" },
    channel: { type: String, default: "" },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: false, // Optional field
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPaymentHistory>(
  "PaymentHistory",
  PaymentHistorySchema
);
