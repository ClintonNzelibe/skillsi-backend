import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { nanoid } from "nanoid";
import Tutor from "../models/Tutor.js";
import Affiliate, { IAffiliate } from "../models/Affiliate.js";
import Course from "../models/Course.js";
import ShortLink from "../models/ShortLink.js";
import { Document } from "mongoose";

// Helper function to get a truly unique shortCode
async function generateUniqueShortCode() {
  let code: string = nanoid(8);
  let exists: boolean = true;

  while (exists) {
    code = nanoid(8);
    exists = Boolean(await ShortLink.exists({ shortCode: code }));
  }

  return code;
}

export async function createLinkInternal(
  courseId: string,
  customerId: string,
  customerModel: string = "Tutor"
) {
  try {
    if (!courseId || !customerId || !customerModel) {
      throw new Error("All fields required");
    }

    const link = await ShortLink.findOne({
      course: courseId,
      customer: customerId,
      customerModel,
    });

    if (link) {
      throw new Error("You already created a link for this course");
    }

    const shortCode = await generateUniqueShortCode();

    const finalLink = await ShortLink.create({
      course: courseId,
      customer: customerId,
      customerModel,
      shortCode,
    });

    return { shortCode: finalLink.shortCode };
  } catch (error: any) {
    console.error("Error creating internal link:", error);
    throw new Error(error?.message || "Internal Server Error");
  }
}

const createShortLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.params;
    const { customerModel } = req.query;
    if (!courseId || !customerModel) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "All fields required",
      });
    }

    let customerId;
    if (customerModel === "Tutor") {
      customerId = req.tutor?.tutorId;
    } else if (customerModel === "Affiliate") {
      customerId = req.affiliate?.affiliateId;
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid Customer Model",
      });
    }
    if (!customerId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: `Missing ${customerModel} Id"` });
    }

    const customer =
      customerModel === "Tutor"
        ? await Tutor.findById(customerId)
        : await Affiliate.findById(customerId);

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Affiliate doesn't exist",
      });
    }

    const link = await ShortLink.findOne({
      course: courseId,
      customer: customerId,
      customerModel,
    });

    if (link) {
      return res.status(StatusCodes.OK).json({
        success: false,
        message: "You already created a link for this course",
      });
    }

    const shortCode = await generateUniqueShortCode();

    await ShortLink.create({
      course: courseId,
      customer: customerId,
      customerModel,
      shortCode,
    });

    if (customerModel === "Affiliate") {
      const affiliate = customer as IAffiliate & Document;
      affiliate.totalCoursesPromoted =
        (affiliate.totalCoursesPromoted || 0) + 1;
      await affiliate.save();
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Short link created successfully",
      shortCode,
      // shortUrl: `https://yourapp.com/r/${link.shortCode}`,
    });
  } catch (error) {
    console.error("Error creating short link:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getShortLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { shortCode } = req.params;

    const shortLink = await ShortLink.findOne({ shortCode }).populate("course");
    if (!shortLink) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Short link not found" });
    }

    res.json({
      success: true,
      message: "Short Link gotten successfully",
      data: {
        _id: shortLink._id,
        courseId: shortLink.course,
        customerId: shortLink.customer,
        customerModel: shortLink.customerModel,
        shortCode: shortLink.shortCode,
      },
    });
  } catch (error) {
    console.error("Error fetching short link:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getAllPromotedCourses = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const affiliateId = req.affiliate?.affiliateId;

    if (!affiliateId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Invalid Affiliate ID" });
    }
    const promotedCourses = await ShortLink.find({
      customer: affiliateId,
      customerModel: "Affiliate",
    })
      .skip(skip)
      .limit(limit)
      .populate("course", "title");

    if (!promotedCourses || promotedCourses.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No Promoted Courses found",
        promotedCourses: [],
      });
    }

    const totalPromotedCoursesCount = await ShortLink.countDocuments({
      affiliate: affiliateId,
    });
    const totalPages = Math.ceil(totalPromotedCoursesCount / limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      promotedCourses,
      page,
      totalCoursePerPage: promotedCourses.length,
      totalPages,
      totalCourses: totalPromotedCoursesCount,
    });
  } catch (error) {
    console.error("Error fetching all promoted courses:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getTutorAffiliateCourses = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { courseId } = req.params;
    const tutorId = req.tutor?.tutorId;

    if (!courseId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Invalid Course ID" });
    }

    const course = await Course.findOne({ _id: courseId, tutor: tutorId });

    if (!course) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to view promotions for this course",
      });
    }

    const promotedCourses = await ShortLink.find({ course: courseId })
      .skip(skip)
      .limit(limit)
      .populate(
        "affiliate",
        "profilePicture firstName lastName userName email"
      );

    if (!promotedCourses || promotedCourses.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No Promoted Courses found",
        promotedCourses: [],
      });
    }

    const totalpromotedCoursesCount = await ShortLink.countDocuments({
      course: courseId,
    });
    const totalPages = Math.ceil(totalpromotedCoursesCount / limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      promotedCourses,
      page,
      totalCoursePerPage: promotedCourses.length,
      totalPages,
      totalCourses: totalpromotedCoursesCount,
    });
  } catch (error) {
    console.error("Error fetching all promoted courses:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export {
  createShortLink,
  getShortLink,
  getAllPromotedCourses,
  getTutorAffiliateCourses,
};
