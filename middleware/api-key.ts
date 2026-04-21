import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const API_KEY = process.env.API_KEY; // Store this securely

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
  process.exit(1);
}

const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {

  if (req.originalUrl.startsWith("/api/v1/payment/webhook")) {
    return next();
  }
  const apiKey = req.headers["x-api-key"]; // Expect key in headers
//   console.log("Received:", apiKey);
//   console.log("Expected:", API_KEY);
//   console.log("Match:", apiKey === API_KEY);  
  

  if (!apiKey) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "API key is required",
    });
  }

  if (apiKey !== API_KEY) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Invalid API key",
    });
  }

  // if (!apiKey || apiKey !== API_KEY) {
  //   return res
  //     .status(StatusCodes.FORBIDDEN)
  //     .json({ success: false, message: "Unauthorized access" });
  // }

  next();
};

export default apiKeyMiddleware;
