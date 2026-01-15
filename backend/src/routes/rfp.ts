import { Router } from "express";
import {
  validateChatParams,
  validateFinalizeRfpInput,
  validateRfpInput,
} from "../middleware/chat.middleware";
import {
  chatHistory,
  chatWithAi,
  finalizedRfpAndSendMail,
  getPreviousChat,
  getVendors,
} from "../controller/chat.controller";

const router = Router();

// get chat history
router.get("/history", chatHistory);

// get chat history for a particular sessionid
router.get("/chat/:id", validateChatParams, getPreviousChat);

// chat with ai to get finalized email
router.post("/chat", validateRfpInput, chatWithAi);

// finalized rfp
router.post("/finalize", validateFinalizeRfpInput, finalizedRfpAndSendMail);

// get vendors
router.get("/vendors", getVendors);


export default router;
