import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { nanoid } from "nanoid";
import ShortLink from "../models/ShortLink.js";

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

const createShortLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId, affiliateId } = req.body;

    if (!courseId || !affiliateId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Missing courseId or affiliateId" });
    }

    let link = await ShortLink.findOne({ courseId, affiliateId });

    if (!link) {
      const shortCode = await generateUniqueShortCode();

      link = new ShortLink({
        courseId,
        affiliateId,
        shortCode,
      });

      await link.save();
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Short link created successfully",
      shortUrl: `https://yourapp.com/r/${link.shortCode}`,
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

    const shortLink = await ShortLink.findOne({ shortCode });
    if (!shortLink) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Short link not found" });
    }

    res.json({
      courseId: shortLink.courseId,
      affiliateId: shortLink.affiliateId,
      shortCode: shortLink.shortCode,
    });
  } catch (error) {
    console.error("Error fetching short link:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
