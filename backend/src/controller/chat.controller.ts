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
import { sendRfp } from "../services/email.services";

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
            status: true,
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
    let { sessionId, isChanged, title, description, vendorIds } = req.body;

    // 1. Basic Session Validation
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { rfp: true },
    });

    if (!session || !session.rfpId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid session" });
    }

    // 2. VENDOR CHECK: Validate that ALL provided vendor IDs exist in DB
    const existingVendors = await prisma.vendor.findMany({
      where: {
        id: { in: vendorIds },
      },
    });

    if (existingVendors.length !== vendorIds.length) {
      return res.status(404).json({
        success: false,
        message: `Some vendors were not found}`,
      });
    }

    // 3. Update RFP and Create Junction Records using a transaction
    const rfpUpdated = await prisma.$transaction(async (tx) => {
      // A. Update the RFP status
      const updated = await tx.rFP.update({
        where: { id: session.rfpId! },
        data: {
          status: "SENT",
          sentAt: new Date(),
          title: isChanged ? title : undefined,
          description: isChanged ? description : undefined,
          // B. Map RFP to Vendors in junction table
          rfpVendors: {
            create: vendorIds.map((vId: string) => ({
              vendor: { connect: { id: vId } },
            })),
          },
        },
      });
      return updated;
    });

    // 4. Send Emails (using the validated list)
    let emailSummaryList = "";
    for (const vendor of existingVendors) {
      const trackingFooter = `\n\n--- SYSTEM INFO ---\nRef: [RFP:${rfpUpdated.id}][VND:${vendor.id}]`;
      const emailText = `${rfpUpdated.description}${trackingFooter}`;

      await sendRfp(vendor.email, `New RFP: ${rfpUpdated.title}`, emailText);
      emailSummaryList += `• ${vendor.name} (${vendor.email})\n`;
    }

    // 5. Save System Message to Chat
    const systemMsg = `RFP finalized and sent to:\n${emailSummaryList}`;
    await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: "SYSTEM",
        content: systemMsg,
      },
    });

    return res.status(200).json({ success: true, rfp: rfpUpdated });
  } catch (error) {
    console.error("Finalize Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to finalize RFP" });
  }
};

// get vendors
export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return res.status(200).json({
      success: true,
      vendors: vendors ?? [],
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
