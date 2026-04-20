import mongoose, { Schema } from "mongoose";
// Course Schema
const CourseSchema = new Schema({
    bannerImage: {
        type: String,
        required: [true, "Please provide banner image"],
        trim: true,
    },
    title: {
        type: String,
        required: [true, "Please provide the title"],
        trim: true,
    },
    subTitle: {
        type: String,
        required: [true, "Please provide the subtitle"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please provide description"],
        trim: true,
    },
    objectives: {
        type: [String],
        required: [true, "Please provide objectives"],
        trim: true,
    },
    requirements: {
        type: [String],
        required: [true, "Please provide requirements"],
        trim: true,
    },
    targetAudience: {
        type: [String],
        required: [true, "Please provide target audience"],
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Please provide category"],
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Please provide category"],
    },
    noOfStudents: {
        type: Number,
        default: 0,
        // required: [true, "Please provide number of students"],
        trim: true,
    },
    language: {
        type: String,
        required: [true, "Please provide language"],
        trim: true,
    },
    otherLanguages: {
        type: [String],
        required: [true, "Please provide other languages"],
        trim: true,
    },
    thumbnail: {
        type: String,
        required: [true, "Please provide thumbnail"],
        trim: true,
    },
    promoVideoUrl: {
        type: String,
        // required: [true, "Please provide promo video URL"],
        trim: true,
    },
    priceInNaira: {
        type: Number,
        required: [true, "Please provide price in Naira"],
        trim: true,
    },
    priceInDollar: {
        type: Number,
        required: [true, "Please provide price in Dollar"],
        trim: true,
    },
    priceInPounds: {
        type: Number,
        required: [true, "Please provide price in Pounds"],
        trim: true,
    },
    totalReview: {
        type: Number,
        default: 0,
        min: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalRating: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalUserRated: {
        type: Number,
        default: 0,
        min: 0,
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tutor",
        required: true,
    },
    allowAffiliate: {
        type: Boolean,
        default: false,
    },
    affiliateCommission: {
        type: Number,
        default: 0,
        min: 0,
        max: 100, // Percentage
        validate: {
            validator: function (v) {
                return v >= 0 && v <= 100;
            },
            message: "Affiliate commission must be between 0 and 100",
        },
    },
    allowQuestions: {
        type: Boolean,
        default: false,
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAffiliate: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalEnrollments: {
        type: Number,
        default: 0,
        min: 0,
    },
    numberOfModules: {
        type: Number,
        default: 0,
        min: 0,
    },
    numberOfLessons: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalDuration: {
        type: Number,
        default: 0, // store in seconds or minutes as you prefer
    },
    status: {
        type: String,
        enum: ["live", "rejected", "pending"],
        default: "live",
        required: [true, "Please provide approval status"],
    },
    shortCode: {
        type: String,
        // required: [true, "Please provide the short code"],
        unique: true,
    },
}, { timestamps: true });
// Export course Model
export default mongoose.model("Course", CourseSchema);
