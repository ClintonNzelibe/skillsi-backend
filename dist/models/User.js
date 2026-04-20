import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
const UserSchema = new Schema({
    fullName: {
        type: String,
        trim: true,
        default: "",
        required: [true, "Please provide full name"],
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
    accountClosed: {
        type: Boolean,
        default: false,
    },
    notificationPreferences: {
        inApp: { type: Boolean, default: false },
        email: { type: Boolean, default: false },
    },
    learningReminder: {
        type: Boolean,
        default: false,
    },
    deviceTokens: {
        type: [String],
        default: [],
    },
    currentDeviceToken: {
        type: String,
        default: "",
        required: [true, "Please provide current device id"],
    },
    isLoggedIn: {
        type: Boolean,
        default: false,
    },
    // passwordChanged: {
    //   type: Boolean,
    //   default: false,
    // },
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
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    numberOfEdits: {
        type: Number,
        default: 0,
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
        enum: ["pending", "approved", "blocked", "suspended"],
        default: "approved",
    },
    totalPurchasedCourses: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });
UserSchema.pre("save", async function () {
    // console.log(this.modifiedPaths());
    // console.log(this.isModified('name'));
    if (!this.isModified("password"))
        return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        return false;
    }
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};
export default mongoose.model("User", UserSchema);
