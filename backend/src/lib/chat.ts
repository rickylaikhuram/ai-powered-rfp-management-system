import { ChatMessage } from "../services/chat.services";

export const getFormattedChatHistory = async (
  chatHistory: ChatMessage[] | null,
  maxMessages: number = 6
): Promise<string> => {
  try {
    if (!chatHistory || chatHistory.length === 0) {
      return ""; // Return empty string for no history
    }

    // Format history with limited messages
    const recentHistory = chatHistory.slice(-maxMessages);
    let formattedHistory = "CONVERSATION HISTORY:\n";

    recentHistory.forEach((msg) => {
      const role = msg.role === "USER" ? "User" : "Assistant";
      formattedHistory += `${role}: ${msg.content}\n`;
    });

    formattedHistory += "\n";
    return formattedHistory;
  } catch (error) {
    console.error("Error formatting chat history:", error);
    return "";
  }
};
