import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { ChatMessage } from "./chat.services";
import { getFormattedChatHistory } from "../lib/chat";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const processRfpWithGemini = async (
  userInput: string,
  chatHistory: ChatMessage[] | null = [],
  existingRfpContext?: {
    isExisting: boolean;
    currentTitle: string;
    currentDescription: string;
  }
) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Lower temperature for more consistent results
    },
  });

  // Format chat history if it exists
  const historyContext = getFormattedChatHistory(chatHistory);
  // Build context based on whether we have an existing RFP
  let rfpContext = "";
  if (existingRfpContext?.isExisting) {
    rfpContext = `
    IMPORTANT: This conversation ALREADY HAS AN EXISTING RFP that needs to be MODIFIED.
    CURRENT RFP:
    - Title: "${existingRfpContext.currentTitle}"
    - Description: "${existingRfpContext.currentDescription}"
    
    The user now wants to make CHANGES to this existing RFP. You need to:
    1. Analyze what specific changes they're requesting
    2. Update the RFP content accordingly
    3. Create a NEW version of the RFP that incorporates the changes
    4. Provide a summary of what was changed for the chat message
    `;
  } else {
    rfpContext = `
    There is NO existing RFP. The user is either:
    1. Starting a new RFP conversation, OR
    2. Continuing to provide details for a new RFP
    `;
  }

  const prompt = `
    ${rfpContext}
    ${historyContext}
    
    NEW USER MESSAGE: "${userInput}"
    
    You are a procurement assistant analyzing whether this conversation is about creating a Request for Proposal (RFP).
    
    ANALYZE THE ENTIRE CONVERSATION, not just the last message. Sometimes RFP details are provided over multiple messages.
    
    DECISION CRITERIA:
    1. Is the user describing a procurement need? (buying products/services for business)
    2. Are they providing specific details like:
       - What they want to purchase
       - Quantity/amount needed
       - Specifications/requirements
       - Budget or pricing considerations
       - Timeline/deadline
    3. Is this a continuation of previous procurement discussion?
    
    IF IT'S AN RFP (set isRfp: true):
    - Generate a professional email subject for vendors
    - Create a detailed RFP email body including all gathered information
    
    IF IT'S NOT AN RFP (set isRfp: false):
    - Provide helpful guidance in the "reason" field
    - Ask for missing information if it seems like they're trying to create an RFP
    
    RESPONSE FORMAT (JSON ONLY):
    {
      "isRfp": boolean,
      "emailSubject": string | null,
      "emailBody": string | null,
      "reason": string (explain why not an RFP or ask for more details) | null
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up the response (sometimes Gemini adds markdown code blocks)
    const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error processing with Gemini:", error);

    // Fallback response
    return {
      isRfp: false,
      emailSubject: null,
      emailBody: null,
      reason:
        "I need more details about your procurement needs. What are you looking to purchase, and what are your requirements?",
    };
  }
};
