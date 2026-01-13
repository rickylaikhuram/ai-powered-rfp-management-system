import { Response, NextFunction, Request } from "express";
import dotenv from "dotenv";

dotenv.config();

// Middleware: Check if user is authenticated or create guest identity
export const identifySessionUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check both cookie and Authorization header
  const { data } = req.body;

  // If no cookie token, check Authorization header
  if (!data) {
    res
      .status(400)
      .json({ success: false, message: "give me a valid RFP scenario" });
    return;
  }

  try {
    return next(); 
  } catch (err) {
    console.error("Guest token creation failed:", err);
    throw { statusCode: 500, message: "Internal server error" };
  }
};
