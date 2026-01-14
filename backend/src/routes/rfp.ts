import { Router } from "express";
import {
  validateChatParams,
  validateFinalizeRfpInput,
  validateRfpInput,
} from "../middleware/chat.middleware";
import {
  chatHistory,
  chatWithAi,
  finalizedRfp,
  getPreviousChat,
  getVendors,
} from "../controller/chat.controller";

const router = Router();

// get chat history
router.get("/history", chatHistory);

// chat with ai to get finalized email
router.get("/chat/:id", validateChatParams, getPreviousChat);

// chat with ai to get finalized email
router.post("/chat", validateRfpInput, chatWithAi);

// finalized rfp
router.post("/finalize", validateFinalizeRfpInput, finalizedRfp);

// get vendors
router.get("/vendors", getVendors);

// get vendors
router.post("/vendors", chatWithAi);
// get vendors
router.get("/vendors", chatWithAi);

export default router;
