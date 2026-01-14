import { Response, NextFunction, Request } from "express";

// Middleware: start interacting with ai if data exist in the body
export const validateRfpInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data } = req.body;
  // Requirement: Check if data exists inside body
  if (!data || typeof data !== "string" || data.trim() === "") {
    res.status(400).json({
      success: false,
      message:
        "A valid natural language description is required to create an RFP.",
    });
    return;
  }

  // If data exists, proceed to the next controller
  next();
};

export const validateChatParams = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  // Requirement: Check if data exists inside body
  if (!id || typeof id !== "string" || id.trim() === "") {
    res.status(400).json({
      success: false,
      message:
        "A valid session id is required to get the chat history.",
    });
    return;
  }

  // If data exists, proceed to the next controller
  next();
};

export const validateFinalizeRfpInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { isChange, title, description, sessionId } = req.body;
  // Check if data exists inside body
  if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "sessionId is required and must be a string",
    });
  }

  // isChange validation
  if (typeof isChange !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isChange must be a boolean",
    });
  }

  // Conditional validation
  if (isChange) {
    if (
      !title ||
      typeof title !== "string" ||
      title.trim() === "" ||
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "title and description are required when isChange is true",
      });
    }
  }

  next();
};
