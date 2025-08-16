import crypto from "crypto";
import mongoose, { Document, Schema, Types } from "mongoose";

// Example Mongoose schema for PaymentMethod

interface PaymentMethodDocument extends Document {
  user: Types.ObjectId;
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

const PaymentMethodSchema = new Schema<PaymentMethodDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide the user id"],
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

export default mongoose.model<PaymentMethodDocument>(
  "PaymentMethod",
  PaymentMethodSchema
);
