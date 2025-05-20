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
  cardType: string; // Stores the type/brand of the card, e.g., 'Visa', 'MasterCard', 'Amex', etc.
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
    },
    lastFour: {
      type: String,
      required: [true, "Please provide card holder"],
    },
    expMonth: {
      type: String,
      required: [true, "Please provide the expiring  month"],
    },
    expYear: {
      type: String,
      required: [true, "Please provider the expiring year"],
    },
    bank: {
      type: String,
      required: [true, "Please provider the bank name"],
    },
    cardType: {
      type: String,
      required: [true, "Please provider the bank name"],
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
