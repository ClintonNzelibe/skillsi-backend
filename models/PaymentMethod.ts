import crypto from "crypto";
import mongoose, { Document, Schema, Types } from "mongoose";

// Example Mongoose schema for PaymentMethod

interface IPaymentMethodDocument extends Document {
  customer: Types.ObjectId;
  customerModel: "User" | "Admin" | "Affiliate";
  authorizationCode: string;
  bin: string;
  lastFour: string;
  expMonth: string;
  expYear: string;
  bank: string;
  cardType: string;
  cardHolderName: string;
  isDefault: boolean;
}

const PaymentMethodSchema = new Schema<IPaymentMethodDocument>(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "customerModel",
      required: [true, "Please provide the customer id"],
    },
    customerModel: {
      type: String,
      required: [true, "Please provider customer model"],
      enum: ["User", "Admin", "Affiliate"], // models it can point to
    },
    authorizationCode: {
      type: String,
      required: [true, "Please provide card number"],
    },
    bin: {
      type: String,
      default: "",
      required: [true, "Please provide bin number"],
    },
    lastFour: {
      type: String,
      required: [true, "Please provide last four digits of the card"],
    },
    expMonth: {
      type: String,
      required: [true, "Please provide expiring month"],
    },
    expYear: {
      type: String,
      required: [true, "Please provider expiring year"],
    },
    bank: {
      type: String,
      required: [true, "Please provider bank name"],
    },
    cardType: {
      type: String,
      required: [true, "Please provide card type"],
    },
    cardHolderName: {
      type: String,
      required: [true, "Please provide card holder name"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPaymentMethodDocument>(
  "PaymentMethod",
  PaymentMethodSchema
);
