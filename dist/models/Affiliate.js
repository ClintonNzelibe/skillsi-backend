import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
const AffiliateSchema = new Schema({
    firstName: {
        type: String,
        required: [true, "Please provide first name"],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Please provide last name"],
        trim: true,
    },
    userName: {
        type: String,
        unique: true,
        required: [true, "Please provide a username"],
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please provide email address"],
        validate: {
            validator: (str) => validator.isEmail(str),
            message: "Please provide valid email",
        },
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        validate: {
            validator: (str) => str === "" || validator.isMobilePhone(str, "any"),
            message: "Please provide a valid phone number",
        },
        trim: true,
        default: "",
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
        validate: {
            validator: (str) => validator.isStrongPassword(str),
            message: "Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.",
        },
        trim: true,
        select: false,
        minlength: 12,
    },
    profilePicture: {
        type: String,
        default: "https://res.cloudinary.com/dqj8v0x5g/image/upload/v1697060982/DefaultProfilePicture.png",
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalWithdrawals: {
        type: Number,
        default: 0,
        min: 0,
    },
    pendingWithdrawals: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalCoursesSold: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalCoursesPromoted: {
        type: Number,
        default: 0,
        min: 0,
    },
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    lastLoggedIn: {
        type: Date,
    },
    loggedInTimes: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended"],
        default: "approved",
    },
    numberOfEdits: { type: Number, default: 0 },
    totalEnrollments: {
        type: Number,
        default: 0,
    },
    verificationToken: { type: String },
    verificationTokenExpirationDate: { type: Date },
    verified: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    resetToken: {
        type: String,
    },
    isResetTokenVerified: {
        type: Boolean,
        default: false,
    },
    resetTokenExpirationDate: {
        type: Date,
    },
}, { timestamps: true });
AffiliateSchema.pre("save", async function () {
    if (!this.isModified("password"))
        return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
AffiliateSchema.methods.comparePassword = async function (canditatePassword) {
    const isMatch = await bcrypt.compare(canditatePassword, this.password);
    return isMatch;
};
export default mongoose.model("Affiliate", AffiliateSchema);
