import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { compareProposalsWithAI } from "../services/ai.services";
import { pollVendorEmails } from "../services/email.services";
import { formatComparisonToParagraph } from "../lib/formatResponse";

// get proposal history
export const getProposalMails = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "need session id",
      });
    }
    console.log("before mail checks")
    await pollVendorEmails();
    console.log("after mail checks")
    const mails = await prisma.chatSession.findUnique({
      where: {
        id: sessionId as string,
      },
      select: {
        rfp: {
          select: {
            proposals: {
              select: {
                id: true,
                rawEmailBody: true,
                emailSubject: true,
                emailFrom: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      mails: mails?.rfp?.proposals ?? [],
      proposalExists: mails?.rfp?.proposals ? true : false,
    });
  } catch (error) {
    console.error("Error in proposal history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get proposal date for a particular id
export const getProposalMailsById = async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: "need proposal id",
      });
    }
    const mails = await prisma.proposal.findUnique({
      where: {
        id: proposalId as string,
      },
    });

    return res.status(200).json({
      success: true,
      mails: mails ?? [],
    });
  } catch (error) {
    console.error("Error in proposal history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get report for comparing proposal
export const generateComparisonReport = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    // 1. Fetch Proposals with nested Vendor data
    const data = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        rfp: {
          select: {
            title: true,
            description: true,
            proposals: {
              include: { vendor: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!data?.rfp || data.rfp.proposals.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No proposals found to compare." });
    }

    await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: "USER",
        content: "Analyze and compare the available vendor proposals for me.",
        isRfp: false,
      },
    });
    // 2. Transform for AI
    const aiContext = {
      rfpTitle: data.rfp.title,
      rfpDescription: data.rfp.description,
      vendorBids: data.rfp.proposals.map((p) => ({
        vendorName: p.vendor.name,
        price: p.price,
        deliveryDays: p.deliveryDays,
        warranty: p.warranty,
        aiSummary: p.aiSummary,
        aiScore: p.aiScore,
      })),
    };

    // 3. Get Comparison from Gemini
    const evaluation = await compareProposalsWithAI(aiContext);

    // 4. Format into a Paragraph
    const reportParagraph = formatComparisonToParagraph(evaluation);

    // 5. SAVE TO DATABASE as a Chat Message
    const savedMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: "ASSISTANT",
        content: reportParagraph,
        isRfp: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: savedMessage,
    });
  } catch (error) {
    console.error("Comparison Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
