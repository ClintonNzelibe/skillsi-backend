import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPaymentHistory extends Document {
  user: Types.ObjectId;
  course?: Types.ObjectId;
  reference: string;
  transactionId?: string;
  amount: number;
  status: "pending" | "success" | "failed";
  bank: string;
  cardType: string; // Stores the type/brand of the card, e.g., 'Visa', 'MasterCard', 'Amex', etc.
  gatewayResponse?: string;
  channel?: string;
  currency?: string;
  paidAt?: Date;
}

const PaymentHistorySchema: Schema<IPaymentHistory> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provider user id"],
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
    transactionId: {
      type: String,
      required: [true, "Please provide transaction id"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Please provide amount"],
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    bank: {
      type: String,
      required: [true, "Please provider the bank name"],
    },
    cardType: {
      type: String,
      required: [true, "Please provider the bank name"],
    },
    gatewayResponse: { type: String, default: "" },
    channel: { type: String, default: "" },
    currency: { type: String, default: "" },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPaymentHistory>(
  "PaymentHistory",
  PaymentHistorySchema
);
