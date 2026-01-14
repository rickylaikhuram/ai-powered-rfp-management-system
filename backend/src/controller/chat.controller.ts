import { Response, Request } from "express";
import { prisma } from "../config/prisma";
import { processRfpWithGemini } from "../services/ai.services";
import {
  ChatMessage,
  getChatHistory,
  getRfp,
  RFP,
} from "../services/chat.services";
import { UpdateData } from "../types/chat";

export const getPreviousChat = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const chatHistory = await prisma.chatSession.findUnique({
      where: { id },
      select: {
        rfp: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
          },
        },
        messages: {
          select: {
            role: true,
            content: true,
            createdAt: true,
            isRfp: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
    if (!chatHistory) {
      return res.status(400).json({
        success: false,
        message: "not a valid session id",
      });
    }

    return res.status(200).json({
      success: true,
      rfp: chatHistory.rfp,
      messages: chatHistory.messages,
      sessionId: id,
    });
  } catch (error) {
    console.error("Error in getting previous chats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const chatWithAi = async (req: Request, res: Response) => {
  try {
    let { sessionId, data } = req.body;
    let chatHistory: ChatMessage[] | null = null;

    // 1. Get or create session
    if (sessionId) {
      chatHistory = await getChatHistory(sessionId);
      if (!chatHistory) {
        return res.status(400).json({
          success: false,
          message: "not a valid session id",
        });
      }
    } else {
      const newSession = await prisma.chatSession.create({});
      sessionId = newSession.id;
      chatHistory = [];
    }

    // 2. Save user message to chat
    await prisma.chatMessage.create({
      data: { content: data, role: "USER", chatSessionId: sessionId },
    });

    // 3. Check if session already has an RFP
    const existingRfp = await getRfp(sessionId);

    // 4. Process with AI - pass existing RFP context if it exists
    const aiResult = await processRfpWithGemini(
      data,
      chatHistory,
      existingRfp
        ? {
            isExisting: true,
            currentTitle: existingRfp.title,
            currentDescription: existingRfp.description,
          }
        : undefined
    );

    if (aiResult.isRfp) {
      let rfpAction = "created";
      let rfpResult: RFP;

      if (existingRfp) {
        // UPDATE existing RFP
        rfpResult = await prisma.rFP.update({
          where: { id: existingRfp.id },
          data: {
            title: aiResult.emailSubject,
            description: aiResult.emailBody,
          },
        });
        rfpAction = "updated";
      } else {
        // CREATE new RFP
        rfpResult = await prisma.rFP.create({
          data: {
            title: aiResult.emailSubject,
            description: aiResult.emailBody,
          },
        });

        // Link session to RFP
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { rfpId: rfpResult.id },
        });
      }

      // 5. Create a chat message summarizing the RFP action
      const message = await prisma.chatMessage.create({
        data: {
          content:
            rfpAction === "created"
              ? `RFP Created!\n**Title:** ${aiResult.emailSubject}\n**Description:** ${aiResult.emailBody}`
              : `RFP Updated!\n**Title:** ${aiResult.emailSubject}\n**Description:** ${aiResult.emailBody}`,
          role: "ASSISTANT",
          chatSessionId: sessionId,
          isRfp: true,
        },
        select: {
          content: true,
          createdAt: true,
          isRfp: true,
          role: true,
        },
      });

      return res.status(200).json({
        success: true,
        isRfp: message.isRfp,
        rfp: rfpResult,
        sessionId,
        message,
      });
    }

    // If not an RFP, just add AI response to chat
    await prisma.chatMessage.create({
      data: {
        content: aiResult.reason,
        role: "ASSISTANT",
        chatSessionId: sessionId,
      },
    });

    return res.status(200).json({
      success: true,
      message: aiResult.reason || "Tell me more about your procurement needs.",
      sessionId,
    });
  } catch (error) {
    console.error("Error in chatWithAi:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get chat history
export const chatHistory = async (req: Request, res: Response) => {
  try {
    const chatHistory = await prisma.chatSession.findMany({
      select: {
        id: true,
        createdAt: true,
        rfp: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      chatHistory: chatHistory ?? [],
    });
  } catch (error) {
    console.error("Error in chat history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const finalizedRfp = async (req: Request, res: Response) => {
  try {
    let { sessionId, isChange, title, description } = req.body;

    const isValid = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        rfpId: true,
      },
    });

    if (!isValid || !isValid.rfpId) {
      return res.status(400).json({
        success: false,
        message: "not a valid session id / doesn't have rfpid",
      });
    }

    const updateData: UpdateData = {
      status: "COMPLETED",
    };

    if (isChange) {
      updateData.title = title;
      updateData.description = description;
    }

    const rfpUpdated = await prisma.rFP.update({
      where: {
        id: isValid.rfpId,
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      rfp: rfpUpdated,
      sessionId,
    });
  } catch (error) {
    console.error("Error in finalized rfp:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get vendors
export const getVendors = async (req: Request, res: Response) => {
  try {
    const vedors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return res.status(200).json({
      success: true,
      vedors: vedors ?? [],
    });
  } catch (error) {
    console.error("Error in get vendors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// add vendors to send mail
export const addVendorsToSendMail = async (req: Request, res: Response) => {
  try {
    const { vendors, sessionId } = req.body;
    const vedors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return res.status(200).json({
      success: true,
      vedors: vedors ?? [],
    });
  } catch (error) {
    console.error("Error in get vendors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
