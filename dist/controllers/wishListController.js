import WishList from "../models/WishList.js";
import { StatusCodes } from "http-status-codes";
// Add to Wishlist
const addToWishList = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user?.userId;
        const existing = await WishList.findOne({ user: userId, course: courseId });
        if (existing) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "Course already in wishlist" });
        }
        await WishList.create({ user: userId, course: courseId });
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Course Added to Wishlist",
        });
    }
    catch (error) {
        console.error("Error adding to wishlist:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
// Get all Wishlist items
const getWishList = async (req, res) => {
    try {
        console.log("🔥 NEW WISHLIST LOGIC RUNNING");
        const userId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;
        const { search } = req.query;
        const wishlist = await WishList.find({ user: userId })
            .populate({
            path: "course",
            match: search
                ? {
                    $or: [
                        { title: { $regex: search, $options: "i" } },
                        { description: { $regex: search, $options: "i" } },
                    ],
                }
                : {},
            select: "title subTitle priceInNaira thumbnail category subcategory tutor",
            populate: [
                { path: "category", select: "name" },
                { path: "subcategory", select: "name" },
                { path: "tutor", select: "fName lName email" },
            ],
        });
        // Filter out those without a course match (populate returns null if no match)
        const filteredItems = wishlist.filter((item) => item.course !== null);
        const paginated = filteredItems.slice(skip, skip + limit);
        if (paginated.length === 0) {
            return res
                .status(StatusCodes.OK)
                .json({ success: true, message: "[]" });
        }
        // const total = await WishList.countDocuments({ user: userId });
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Wishlist fetched successfully",
            wishlist: paginated,
            page,
            totalWishlistPerPage: paginated.length,
            total: filteredItems.length,
            totalPages: Math.ceil(filteredItems.length / limit),
        });
    }
    catch (error) {
        console.error("Error ggetting wishlist:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
// Remove from Wishlist
const removeFromWishList = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const deleted = await WishList.findOneAndDelete({ _id: id, user: userId });
        if (!deleted) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: "Wishlist Not Found" });
        }
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Course removed from wishlist",
        });
    }
    catch (error) {
        console.error("Error removing wishlist:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const clearWishList = async (req, res) => {
    try {
        const userId = req.user?.userId;
        await WishList.deleteMany({ user: userId });
        res
            .status(StatusCodes.OK)
            .json({ success: true, message: "Wishlist cleared" });
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};
export { addToWishList, getWishList, removeFromWishList, clearWishList };
