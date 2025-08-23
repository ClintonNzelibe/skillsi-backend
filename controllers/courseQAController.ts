import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Course from "../models/Course.js";
import CourseQA from "../models/CourseQA.js";
import mongoose from "mongoose";

// 1. Create Question (User)
const createQuestion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.params;
    const { question } = req.body;

    const course = await Course.findById(courseId);

    const newQuestion = await CourseQA.create({
      course: courseId,
      tutor: course?.tutor,
      question,
      user: req.user?.userId,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question submitted successfully",
      data: newQuestion,
    });
  } catch (error) {
    console.error("Create Question Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 2. Answer Question (Tutor)
const answerQuestion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    const question = await CourseQA.findById(questionId);
    if (!question)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Question not found" });

    question.answer = answer;
    question.isAnswered = true;
    question.answeredBy = new mongoose.Types.ObjectId(req.tutor?.tutorId);
    await question.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question answered successfully",
      data: question,
    });
  } catch (error) {
    console.error("Answer Question Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 3. Get all Questions for a Tutor (for their courses)
const getTutorQuestions = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.params;
    const tutorId = req.tutor?.tutorId;

    // Get all course IDs created by the tutor
    // const courses = await Course.find({ tutor: tutorId }, "_id");
    // const courseIds = courses.map((course) => course._id);

    const questions = await CourseQA.find({ course: courseId })
      .populate("user", "profilePicture fullName email")
      .populate("course", "bannerImage title subTitle description tutor");

    if (questions.length && tutorId !== questions[0]?.tutor?.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to view these questions",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      data: questions,
    });
  } catch (error) {
    console.error("Get Tutor Questions Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 4. Get Questions Asked by Logged-In User
const getUserQuestions = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    // 1. User's own questions
    const userQuestions = await CourseQA.find({ user: userId })
      .populate("courseId", "title")
      .populate("answeredBy", "fName lName email profilePicture");

    // 2. Other users' questions
    const otherQuestions = await CourseQA.find({ user: { $ne: userId } })
      .populate("courseId", "title")
      .populate("answeredBy", "fName lName email profilePicture");

    // 3. Merge: user first, others next
    const questions = [...userQuestions, ...otherQuestions];

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched successfully",
      data: questions,
    });
  } catch (error) {
    console.error("Get User Questions Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export { createQuestion, answerQuestion, getTutorQuestions, getUserQuestions };
