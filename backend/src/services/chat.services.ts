import { prisma } from "../config/prisma";
export interface ChatMessage {
  role: string;
  content: string;
  createdAt: Date;
  isRfp: boolean;
}

export const getChatHistory = async (
  sessionId: string
): Promise<ChatMessage[] | null> => {
  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
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

    return chatSession?.messages ?? null;
  } catch (error) {
    console.error("Error getting chat history:", error);
    return null;
  }
};

export interface RFP {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  status: string;
}

export const getRfp = async (sessionId: string): Promise<RFP | null> => {
  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
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
      },
    });

    return chatSession?.rfp ?? null;
  } catch (error) {
    console.error("Error getting chat history:", error);
    return null;
  }
};
