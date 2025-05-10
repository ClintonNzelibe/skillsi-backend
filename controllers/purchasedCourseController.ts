import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import PurchasedCourse from "../models/PurchasedCourse.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";

const fetchPaidCoursesUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId; // Assuming you get the userId from the request params

    // Fetch paid courses for the user
    const paidCourses = await PurchasedCourse.find({
      purchasedBy: userId,
    })
      .select("course overallCompletionPercent")
      .populate({
        path: "course",
        select:
          "_id bannerImage title subTitle description rating promoVideoUrl tutor",
        populate: {
          path: "tutor",
          select:
            "fName lName email profileImage totalStudent totalReviews totalCourses",
        },
      })
      .sort({ purchasedAt: -1 });

    if (!paidCourses || paidCourses.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No paid courses found for this user",
        myLearning: [],
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      myLearning: paidCourses,
    });
  } catch (error) {
    console.error("Error fetching paid courses", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

const fetchSinglePaidCourseUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId || !courseId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "userId and courseId are required" });
    }

    const paidCourse = await PurchasedCourse.findOne({
      purchased: userId,
      course: courseId,
    }).populate({
      path: "course",
      select:
        "_id title subTitle description objectives requirements targetAudience category subcategory noOfStudents language otherLanguages thumbnail rating totalRating totalUserRated promoVideoUrl priceInNaira priceInDollar priceInPounds tutor",
      populate: {
        path: "tutor",
        select: "_id fName lName email profileImage", // add any tutor fields you want
      },
    });

    if (!paidCourse) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Course not found for this user" });
    }

    // Fetch modules for the course
    const modules = await CourseModule.find({ courseId });

    // Attach lessons to each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await CourseLesson.find({ moduleId: module._id });
        return {
          ...module.toObject(),
          lessons,
        };
      })
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        paidCourse,
        modules: modulesWithLessons,
      },
    });
  } catch (error) {
    console.error("Error fetching single paid courses", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

export { fetchPaidCoursesUser, fetchSinglePaidCourseUser };
