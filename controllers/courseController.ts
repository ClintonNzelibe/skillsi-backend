import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UploadFileToCloudinary } from "../helpers/index.js"; // Your cloudinary config file
import Tutor from "../models/Tutor.js";
import Course from "../models/Course.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";
import { CourseStatus } from "../constants/index.js";

const createCourse = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      bannerImage,
      title,
      subTitle,
      description,
      objectives,
      requirements,
      targetAudience,
      category,
      subcategory,
      language,
      otherLanguages,
      priceInNaira,
      priceInDollar,
      priceInPounds,
      thumbnail,
      promoVideoUrl,
      allowAffiliate,
      affiliateCommission,
      allowQuestions,
      // numberOfModules,
      // numberOfLessons,
      // totalDuration,
      modules,
    } = req.body;

    if (
      !bannerImage ||
      !title ||
      !subTitle ||
      !description ||
      !objectives ||
      !requirements ||
      !targetAudience ||
      !category ||
      !subcategory ||
      !language ||
      !thumbnail ||
      !promoVideoUrl
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (typeof allowAffiliate !== "boolean") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "Invalid value for allowAffiliate. It must be a boolean (true or false).",
      });
    }

    // Upload banner image
    const bannerRes = await UploadFileToCloudinary(
      bannerImage,
      {
        folder: "Course",
        allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
        maxSizeInMB: 30,
      },
      res
    );
    const bannerUrl = bannerRes;
    console.log("Banner URL:", bannerUrl, bannerRes);
    

    // Upload thumbnail
    const thumbnailRes = await UploadFileToCloudinary(
      thumbnail,
      {
        folder: "Course",
        allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
        maxSizeInMB: 30,
      },
      res
    );
    const thumbnailUrl = thumbnailRes;

    // Upload promo video
    const promoVideoRes = await UploadFileToCloudinary(
      promoVideoUrl,
      {
        folder: "Course",
        allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
        maxSizeInMB: 3000000000,
      },
      res
    );
    const promoVideoFinalUrl = promoVideoRes;

    // Create course
    const newCourse = await Course.create({
      title,
      subTitle,
      description,
      objectives,
      requirements,
      targetAudience,
      category,
      subcategory,
      language,
      otherLanguages,
      priceInNaira,
      priceInDollar,
      priceInPounds,
      tutor: req.tutor?.tutorId,
      bannerImage: bannerUrl,
      thumbnail: thumbnailUrl,
      promoVideoUrl: promoVideoFinalUrl,
      allowAffiliate,
      affiliateCommission,
      allowQuestions,
    });

    let totalModules = 0;
    let totalLessons = 0;
    let totalDuration = 0;

    // Loop through modules and lessons
    for (const module of modules) {
      totalModules++;

      const createdModule = await CourseModule.create({
        courseId: newCourse._id,
        title: module.title,
        description: module.description,
      });

      for (const lesson of module.lessons) {
        totalLessons++;
        totalDuration += lesson.duration || 0;

        // Handle different lesson types
        let videoUrl = "";
        let resources: string[] = [];

        if (lesson.type === "video") {
          const videoRes = await UploadFileToCloudinary(
            lesson.videoUrl,
            {
              folder: "Course",
              allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
              maxSizeInMB: 150,
            },
            res
          );
          videoUrl = videoRes;
          // videoUrl = lesson.videoUrl;
        }

        if (lesson.resources && lesson.resources.length > 0) {
          for (const resource of lesson.resources) {
            const result = await UploadFileToCloudinary(
              resource,
              {
                folder: "Course",
                allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
                maxSizeInMB: 3000000000,
              },
              res
            );
            resources.push(result);
          }
        }

        await CourseLesson.create({
          moduleId: createdModule._id,
          title: lesson.title,
          type: lesson.type,
          videoUrl,
          content: lesson.content,
          resources,
          order: lesson.order,
          duration: lesson.duration,
        });
      }
    }

    // ✅ Update course with totals
    await Course.findByIdAndUpdate(newCourse._id, {
      totalModules,
      totalLessons,
      totalDuration,
    });

    // ✅ Increment tutor's course count
    await Tutor.findByIdAndUpdate(req.tutor?.tutorId, {
      $inc: { totalCourses: 1 },
    });

    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "Course created successfully" });
  } catch (error) {
    console.error("Error creating course", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

const fetchAllCoursesUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    let filter: any = { $and: [] };

    if (search) {
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (filter.$and.length === 0) delete filter.$and;

    const courses = await Course.find(filter)
      .skip(skip)
      .limit(limit)
      .populate(
        "tutor",
        "fName lName email profileImage totalStudent totalReviews totalCourses"
      )
      .select("-totalEarnings -totalAffiliate -totalEnrollments");
    if (!courses || courses.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No courses found",
        courses: [],
      });
    }

    const totalCoursesCount = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCoursesCount / limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      courses,
      page,
      totalCoursePerPage: courses.length,
      totalPages,
      totalCourses: totalCoursesCount,
    });
  } catch (error) {
    console.error("Error fetching courses", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

const fetchSingleCourseUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
      .populate(
        "tutor",
        "fName lName email profileImage totalStudent totalReviews totalCourses"
      )
      .select(
        "-totalEarnings -totalAffiliate -totalEnrollments -promoVideoUrl"
      );
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get all modules for the course
    const modules = await CourseModule.find({ courseId }).sort({
      createdAt: 1,
    });

    // Attach lessons to each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await CourseLesson.find({ moduleId: module._id })
          .select("-videoUrl -content -resources")
          .sort({ createdAt: 1 });
        return {
          ...module.toObject(),
          lessons,
        };
      })
    );

    res
      .status(StatusCodes.OK)
      .json({ success: true, course, modules: modulesWithLessons });
  } catch (error) {
    console.error("Error fetching single course", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

const fetchAllCoursesTutor = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const tutorId = req.tutor?.tutorId;
    if (!tutorId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Tutor ID missing",
      });
    }

    // Define allowed status values
    // const validStatuses = ["pending", "live", "rejected"];
    const validStatuses = Object.values(CourseStatus);
    let filter: any = {
      tutor: tutorId,
    };

    const andFilters: any[] = [];

    if (search) {
      andFilters.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Status filter
    if (status && status !== "all") {
      // if (!validStatuses.includes(status as string)) {
      if (!validStatuses.includes(status as CourseStatus)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid status value",
        });
      }
      andFilters.push({ status });
    }

    if (andFilters.length === 0) {
      filter.$and = andFilters;
    }

    const courses = await Course.find(filter)
      .skip(skip)
      .limit(limit)
      .populate(
        "tutor",
        "fName lName email profileImage totalStudent totalReviews totalCourses"
      )
      .select("-totalEarnings -totalAffiliate -totalEnrollments");
    if (!courses || courses.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No courses found",
        courses: [],
      });
    }

    const totalCoursesCount = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCoursesCount / limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      courses,
      page,
      totalCoursePerPage: courses.length,
      totalPages,
      totalCourses: totalCoursesCount,
    });
  } catch (error) {
    console.error("Error fetching courses", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

const fetchSingleCourseTutor = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { courseId } = req.params;

    const tutorId = req.tutor?.tutorId;

    if (!tutorId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Tutor ID missing",
      });
    }

    const course = await Course.findById(courseId)
      .populate(
        "tutor",
        "fName lName email profileImage totalStudent totalReviews totalCourses"
      )
      .select(
        "-totalEarnings -totalAffiliate -totalEnrollments -promoVideoUrl"
      );
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check tutor ownership
    if (course.tutor.toString() !== tutorId.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Access denied: You do not own this course",
      });
    }

    // Get all modules for the course
    const modules = await CourseModule.find({ courseId }).sort({
      createdAt: 1,
    });

    // Attach lessons to each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await CourseLesson.find({ moduleId: module._id })
          .select("-videoUrl -content -resources")
          .sort({ createdAt: 1 });
        return {
          ...module.toObject(),
          lessons,
        };
      })
    );

    res
      .status(StatusCodes.OK)
      .json({ success: true, course, modules: modulesWithLessons });
  } catch (error) {
    console.error("Error fetching single course", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

export {
  createCourse,
  fetchAllCoursesUser,
  fetchSingleCourseUser,
  fetchAllCoursesTutor,
  fetchSingleCourseTutor,
};
