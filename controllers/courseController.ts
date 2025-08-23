import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Tutor from "../models/Tutor.js";
import Course from "../models/Course.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";
import ShortLink from "../models/ShortLink.js";
import {
  DeleteFileFromCloudinary,
  UploadFileToCloudinary,
} from "../helpers/index.js"; // Your cloudinary config file
import { CourseStatus } from "../constants/index.js";
import mongoose from "mongoose";

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
      numberOfModules: totalModules,
      numberOfLessons: totalLessons,
      totalDuration,
    });

    // ✅ Increment tutor's course count
    await Tutor.findByIdAndUpdate(req.tutor?.tutorId, {
      $inc: { totalCourses: 1 },
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("Error creating course", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

const updateCourse = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.params;
    const tutorId = req.tutor?.tutorId;
    const id = courseId;

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
      modules,
    } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // ✅ Correct ownership check
    if (!tutorId || course.tutor.toString() !== String(tutorId)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "You are not the owner of this course",
      });
    }

    // ===== Course-level media updates (upload new, then delete old) =====
    let bannerUrl = course.bannerImage;
    if (bannerImage && bannerImage !== course.bannerImage) {
      const newBannerUrl = await UploadFileToCloudinary(
        bannerImage,
        {
          folder: "Course",
          allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
          maxSizeInMB: 30,
        },
        res
      );
      // delete old only after successful upload
      if (course.bannerImage) {
        try {
          await DeleteFileFromCloudinary(course.bannerImage);
        } catch (e) {
          console.error("Delete old banner failed:", e);
        }
      }
      bannerUrl = newBannerUrl;
    }

    let thumbnailUrl = course.thumbnail;
    if (thumbnail && thumbnail !== course.thumbnail) {
      const newThumbUrl = await UploadFileToCloudinary(
        thumbnail,
        {
          folder: "Course",
          allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
          maxSizeInMB: 30,
        },
        res
      );
      if (course.thumbnail) {
        try {
          await DeleteFileFromCloudinary(course.thumbnail);
        } catch (e) {
          console.error("Delete old thumbnail failed:", e);
        }
      }
      thumbnailUrl = newThumbUrl;
    }

    let promoVideoFinalUrl = course.promoVideoUrl;
    if (promoVideoUrl && promoVideoUrl !== course.promoVideoUrl) {
      const newPromoUrl = await UploadFileToCloudinary(
        promoVideoUrl,
        {
          folder: "Course",
          allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
          maxSizeInMB: 3000000000,
        },
        res
      );
      if (course.promoVideoUrl) {
        try {
          await DeleteFileFromCloudinary(course.promoVideoUrl);
        } catch (e) {
          console.error("Delete old promo video failed:", e);
        }
      }
      promoVideoFinalUrl = newPromoUrl;
    }

    // ===== Update main course details =====
    await Course.findByIdAndUpdate(id, {
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
      bannerImage: bannerUrl,
      thumbnail: thumbnailUrl,
      promoVideoUrl: promoVideoFinalUrl,
      allowAffiliate,
      affiliateCommission,
      allowQuestions,
    });

    // ===== Modules/Lessons diffing =====
    const safeModules = Array.isArray(modules) ? modules : [];
    const existingModules = await CourseModule.find({ courseId: id });
    const existingModuleIds = existingModules.map((m: any) => String(m._id));
    const incomingModuleIds = safeModules
      .map((m: any) => m?._id)
      .filter(Boolean)
      .map(String);

    // Remove deleted modules (and their lessons + files)
    for (const module of existingModules) {
      if (!incomingModuleIds.includes(String(module._id))) {
        const lessons = await CourseLesson.find({ moduleId: module._id });
        for (const lesson of lessons) {
          if (lesson.videoUrl) {
            try {
              await DeleteFileFromCloudinary(lesson.videoUrl);
            } catch (e) {
              console.error("Delete lesson video failed:", e);
            }
          }
          if (lesson.resources?.length) {
            for (const resource of lesson.resources) {
              try {
                await DeleteFileFromCloudinary(resource);
              } catch (e) {
                console.error("Delete lesson resource failed:", e);
              }
            }
          }
          await CourseLesson.findByIdAndDelete(lesson._id);
        }
        await CourseModule.findByIdAndDelete(module._id);
      }
    }

    let totalModules = 0;
    let totalLessons = 0;
    let totalDuration = 0;

    // Add/update modules & lessons
    for (const mod of safeModules) {
      totalModules++;
      let moduleId = mod._id;

      if (moduleId && existingModuleIds.includes(String(moduleId))) {
        await CourseModule.findByIdAndUpdate(moduleId, {
          title: mod.title,
          description: mod.description,
        });
      } else {
        const newModule = await CourseModule.create({
          courseId: id,
          title: mod.title,
          description: mod.description,
        });
        moduleId = newModule._id;
      }

      const existingLessons = await CourseLesson.find({ moduleId });
      const existingLessonIds = existingLessons.map((l) => String(l._id));
      const incomingLessonIds = (mod.lessons || [])
        .map((l: any) => l?._id)
        .filter(Boolean)
        .map(String);

      // Remove deleted lessons
      for (const lesson of existingLessons) {
        if (!incomingLessonIds.includes(String(lesson._id))) {
          if (lesson.videoUrl) {
            try {
              await DeleteFileFromCloudinary(lesson.videoUrl);
            } catch (e) {
              console.error("Delete old lesson video failed:", e);
            }
          }
          if (lesson.resources?.length) {
            for (const resource of lesson.resources) {
              try {
                await DeleteFileFromCloudinary(resource);
              } catch (e) {
                console.error("Delete old lesson resource failed:", e);
              }
            }
          }
          await CourseLesson.findByIdAndDelete(lesson._id);
        }
      }

      // Add/update lessons
      for (const incoming of mod.lessons || []) {
        totalLessons++;
        totalDuration += incoming.duration || 0;

        let videoUrl = incoming.videoUrl;
        let resources: string[] = incoming.resources || [];

        if (incoming._id && existingLessonIds.includes(String(incoming._id))) {
          const oldLesson = await CourseLesson.findById(incoming._id);

          // video changed
          if (incoming.videoUrl && incoming.videoUrl !== oldLesson?.videoUrl) {
            if (oldLesson?.videoUrl) {
              try {
                await DeleteFileFromCloudinary(oldLesson.videoUrl);
              } catch (e) {
                console.error("Delete replaced lesson video failed:", e);
              }
            }
            videoUrl = await UploadFileToCloudinary(
              incoming.videoUrl,
              {
                folder: "Course",
                allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
                maxSizeInMB: 150,
              },
              res
            );
          }

          // resources replaced (naive compare)
          if (
            incoming.resources &&
            JSON.stringify(incoming.resources) !==
              JSON.stringify(oldLesson?.resources)
          ) {
            if (oldLesson?.resources?.length) {
              for (const r of oldLesson.resources) {
                try {
                  await DeleteFileFromCloudinary(r);
                } catch (e) {
                  console.error("Delete replaced lesson resource failed:", e);
                }
              }
            }
            resources = [];
            for (const r of incoming.resources) {
              const up = await UploadFileToCloudinary(
                r,
                {
                  folder: "Course",
                  allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
                  maxSizeInMB: 3000000000,
                },
                res
              );
              resources.push(up);
            }
          }

          await CourseLesson.findByIdAndUpdate(incoming._id, {
            title: incoming.title,
            type: incoming.type,
            videoUrl,
            content: incoming.content,
            resources,
            order: incoming.order,
            duration: incoming.duration,
          });
        } else {
          // new lesson
          if (incoming.type === "video" && incoming.videoUrl) {
            videoUrl = await UploadFileToCloudinary(
              incoming.videoUrl,
              {
                folder: "Course",
                allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
                maxSizeInMB: 150,
              },
              res
            );
          }

          if (incoming.resources?.length) {
            resources = [];
            for (const r of incoming.resources) {
              const up = await UploadFileToCloudinary(
                r,
                {
                  folder: "Course",
                  allowedFileTypes: ["video/mp4", "video/mov", "video/avi"],
                  maxSizeInMB: 3000000000,
                },
                res
              );
              resources.push(up);
            }
          }

          await CourseLesson.create({
            moduleId,
            title: incoming.title,
            type: incoming.type,
            videoUrl,
            content: incoming.content,
            resources,
            order: incoming.order,
            duration: incoming.duration,
          });
        }
      }
    }

    // Recompute totals
    await Course.findByIdAndUpdate(id, {
      numberOfModules: totalModules,
      numberOfLessons: totalLessons,
      totalDuration,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Error updating course", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
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
    const {
      search,
      trending,
      category,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
    } = req.query;

    let filter: any = { $and: [] };

    if (search) {
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Category filter
    if (category) {
      filter.$and.push({
        category: new mongoose.Types.ObjectId(category as string),
      });
      // filter.$and.push({
      //   category: { $regex: new RegExp(category as string, "i") },
      // });
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceFilter: any = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      filter.$and.push({ priceInNaira: priceFilter });
    }

    // Rating range filter
    if (minRating || maxRating) {
      const ratingFilter: any = {};
      if (minRating) ratingFilter.$gte = Number(minRating);
      if (maxRating) ratingFilter.$lte = Number(maxRating);
      filter.$and.push({ rating: ratingFilter });
    }

    if (filter.$and.length === 0) delete filter.$and;

    // Build sort condition in array form
    let sortCondition: [string, 1 | -1][] = [];

    if (trending === "true") {
      sortCondition = [
        ["totalEnrollments", -1],
        ["rating", -1],
        ["createdAt", -1],
      ];
    } else {
      sortCondition = [["createdAt", -1]];
    }

    const courses = await Course.find(filter)
      .sort(sortCondition)
      .skip(skip)
      .limit(limit)
      .populate(
        "tutor",
        "fName lName email profileImage totalStudent totalReviews totalCourses"
      )
      .populate("category", "name description")
      .select("-totalEarnings -totalAffiliate");

    // const courses = await query;
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
      .populate("category", "name description")
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

    if (andFilters.length > 0) {
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
    if (course.tutor._id.toString() !== tutorId.toString()) {
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

const fetchAllCoursesAffiliate = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const affiliateId = req.affiliate?.affiliateId;

    if (!affiliateId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Affiliate not authenticated",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    let filter: any = { $and: [{ allowAffiliate: true }] };

    if (search) {
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (filter.$and.length === 0) delete filter.$and;

    const courses = await Course.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "shortlinks", // collection name in MongoDB
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course", "$$courseId"] },
                    {
                      $eq: [
                        "$affiliate",
                        new mongoose.Types.ObjectId(affiliateId),
                      ],
                    },
                  ],
                },
              },
            },
            { $project: { shortCode: 1 } },
          ],
          as: "shortLink",
        },
      },
      {
        $addFields: {
          shortLink: { $arrayElemAt: ["$shortLink.shortCode", 0] },
        },
      },
      {
        $project: {
          bannerImage: 1,
          title: 1,
          subTitle: 1,
          description: 1,
          category: 1,
          allowAffiliate: 1,
          affiliateCommission: 1,
          shortLink: 1,
        },
      },
    ]);

    // const courses = await query;
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
    console.error("Error fetching affiliate courses: ", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

const fetchSingleCourseAffiliate = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { courseId } = req.params;
    const affiliateId = req.affiliate?.affiliateId;

    // ✅ Aggregate pipeline
    const courseData = await Course.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(courseId) },
      },
      {
        $lookup: {
          from: "tutors",
          localField: "tutor",
          foreignField: "_id",
          as: "tutor",
        },
      },
      { $unwind: "$tutor" }, // tutor is single, not array
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" }, // category is single
      {
        $lookup: {
          from: "shortlinks",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course", "$$courseId"] },
                    {
                      $eq: [
                        "$affiliate",
                        new mongoose.Types.ObjectId(affiliateId),
                      ],
                    },
                  ],
                },
              },
            },
            { $project: { shortCode: 1 } },
          ],
          as: "shortLink",
        },
      },
      {
        $addFields: {
          shortLink: { $arrayElemAt: ["$shortLink.shortCode", 0] },
        },
      },
      {
        $project: {
          bannerImage: 1,
          title: 1,
          subTitle: 1,
          description: 1,
          tutor: { fName: 1, lName: 1, profileImage: 1 },
          priceInNaira: 1,
          numberOfModules: 1,
          numberOfLessons: 1,
          totalDuration: 1,
          affiliateCommission: 1,
          category: { name: 1, description: 1 },
          shortLink: 1,
        },
      },
    ]);

    if (!courseData || courseData.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    const course = courseData[0];

    // ✅ Fetch modules & lessons separately (still needed)
    const modules = await CourseModule.find({ courseId }).sort({
      createdAt: 1,
    });

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

    res.status(StatusCodes.OK).json({
      success: true,
      course,
      modules: modulesWithLessons,
    });
  } catch (error) {
    console.error("Error fetching single course", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, messgae: "Internal Server Error" });
  }
};

export {
  createCourse,
  updateCourse,
  fetchAllCoursesUser,
  fetchSingleCourseUser,
  fetchAllCoursesTutor,
  fetchSingleCourseTutor,
  fetchAllCoursesAffiliate,
  fetchSingleCourseAffiliate,
};
