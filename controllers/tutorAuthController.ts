import { Request, Response } from "express";
import Tutor from "../models/Tutor";
import { StatusCodes } from "http-status-codes";
import { createTokenTutor, createTutorJWT } from "../utils/index.js";
import { TokenTutor } from "../type.js";

const signupTutor = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fName, lName, email, password } = req.body;

    if (!fName || !lName || !email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingTutor = await Tutor.findOne({ email });
    if (existingTutor) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email already in use",
      });
    }

    await Tutor.create({
      fName,
      lName,
      email,
      password,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tutor registered successfully",
    });
  } catch (error) {
    console.error("Signup error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const signinTutor = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await tutor.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (tutor.status !== "approved") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Account is ${tutor.status}`,
      });
    }

    // Ensure required fields are not undefined
    if (!tutor._id || !tutor.fName || !tutor.lName || !tutor.email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Incomplete tutor data" });
    }

    const tokenTutor: TokenTutor = createTokenTutor({
      tutorId: tutor?._id?.toString() || "",
      fName: tutor?.fName || "",
      lName: tutor?.lName || "",
      email: tutor?.email || "",
    });

    const token = createTutorJWT(tokenTutor);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor Signedin successfully",
      token,
    });
  } catch (error) {
    console.error("Signin error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { signupTutor, signinTutor };
