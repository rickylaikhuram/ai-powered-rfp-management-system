import { Response, NextFunction, Request } from "express";
import { finalizedRfpSchema, inputSchema, paramsSchema } from "../lib/zod";
import z from "zod";

// Middleware: start interacting with ai if data exist in the body
export const validateRfpInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if data exists inside body
  const result = inputSchema.safeParse(req.body.data);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: z.prettifyError(result.error),
    });
  }

  // If data exists, proceed to the next controller
  next();
};

export const validateChatParams = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if data exists inside body
  const result = paramsSchema.safeParse(req.params.id);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: z.prettifyError(result.error),
    });
  }

  // If data exists, proceed to the next controller
  next();
};

export const validateFinalizeRfpInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = finalizedRfpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: z.prettifyError(result.error),
    });
  }

  // If data exists, proceed to the next controller
  next();
};
