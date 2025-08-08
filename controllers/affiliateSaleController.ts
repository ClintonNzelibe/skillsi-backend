import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AffiliateSale from "../models/AffiliateSale.js"; // Adjust the path as needed

// GET /api/affiliate-sales/course/:courseId
const getAffiliateSalesByCourse = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.params;

    if (courseId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Invalid course ID" });
    }

    const sales = await AffiliateSale.find({ courseId })
      .populate("buyerId", "name email")
      .populate("affiliateId", "name email")
      .populate("courseId", "title price");

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Affiliate sales fetched successfully",
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, sale) => sum + sale.amount, 0),
      totalCommission: sales.reduce((sum, sale) => sum + sale.commission, 0),
      sales,
    });
  } catch (error) {
    console.error("Error fetching affiliate sales:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export { getAffiliateSalesByCourse };
