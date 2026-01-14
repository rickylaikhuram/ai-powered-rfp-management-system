// Input Validation
import z, { array, boolean, string, uuid } from "zod";

export const inputSchema = z
  .string()
  .min(3, { message: "Input field cannot be empty" });

export const paramsSchema = z.uuid({ message: "need a valid uuid" });

export const finalizedRfpSchema = z.object({
  isChanged: z.boolean(),

  title: z.string().min(3, { message: "title field cannot be empty" }),

  description: z
    .string()
    .min(3, { message: "description field cannot be empty" }),

  sessionId: z.uuid(),

  vendorIds: z.array(z.uuid()),
});
