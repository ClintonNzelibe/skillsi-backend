import mongoose, { Schema } from "mongoose";
const PaymentHistorySchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: "User",
        refPath: "customerModel",
        required: [true, "Please provider customer id"],
    },
    customerModel: {
        type: String,
        required: [true, "Please provider customer model"],
        enum: ["User", "Tutor", "Affiliate"],
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
    transactionType: {
        type: String,
        enum: [
            "card_tokenization",
            "course_payment",
            "tutor_withdrawal",
            "affiliate_withdrawal",
        ],
        required: [true, "Please provide transaction type"],
        default: "course_payment",
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
}, { timestamps: true });
PaymentHistorySchema.pre("save", function (next) {
    if (!this.type) {
        switch (this.transactionType) {
            case "course_payment":
            case "tutor_withdrawal":
            case "affiliate_withdrawal":
            case "card_tokenization":
                this.type = "debit";
                break;
            default:
                this.type = "credit"; // fallback
        }
    }
    next();
});
export default mongoose.model("PaymentHistory", PaymentHistorySchema);
