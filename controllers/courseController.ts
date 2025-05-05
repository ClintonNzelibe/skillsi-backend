import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UploadFileToCloudinary } from "../helpers/index.js"; // Your cloudinary config file
import Course from "../models/Course.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";

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
      modules,
    } = req.body;

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
    const bannerUrl = bannerRes.secure_url;

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
    const thumbnailUrl = thumbnailRes.secure_url;

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
    const promoVideoFinalUrl = promoVideoRes.secure_url;

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
      tutor: req.admin?.adminId,
      bannerImage: bannerUrl,
      thumbnail: thumbnailUrl,
      promoVideoUrl: promoVideoFinalUrl,
    });

    // Loop through modules and lessons
    for (const module of modules) {
      const createdModule = await CourseModule.create({
        courseId: newCourse._id,
        title: module.title,
        description: module.description,
      });

      for (const lesson of module.lessons) {
        let videoUrl = "";
        let resources: string[] = [];

        if (lesson.type === "video") {
          const videoRes = await UploadFileToCloudinary(
            lesson.videoUrl,
            {
              folder: "Course",
              allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
              maxSizeInMB: 3000000000,
            },
            res
          );
          videoUrl = videoRes.secure_url;
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
            resources.push(result.secure_url);
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
    const courses = await Course.find({}).populate(
      "tutor",
      "fName lName email profileImage totalStudent totalReviews totalCourses"
    );
    if (!courses || courses.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No courses found",
        courses: [],
      });
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Fetched successfully", courses });
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
    const course = await Course.findById(courseId).populate(
      "tutor",
      "fName lName email profileImage totalStudent totalReviews totalCourses"
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

export { createCourse, fetchAllCoursesUser, fetchSingleCourseUser };
