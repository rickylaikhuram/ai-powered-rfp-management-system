import React from "react";
import type { Message } from "../types/chat";

// Define the message type
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";



interface ChatMessagesProps {
  messages: Message[];
  showRoleLabel?: boolean;
  className?: string;
  userBubbleColor?: string;
  assistantBubbleColor?: string;
  rfpBubbleColor?: string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  showRoleLabel = true,
  className = "",
  userBubbleColor = "bg-blue-600 text-white",
  assistantBubbleColor = "bg-gray-800 border border-gray-700 text-gray-100",
  rfpBubbleColor = "bg-gray-800 border border-gray-700 text-gray-100",
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "USER" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-3xl w-full ${
              message.role === "USER" ? "flex justify-end" : ""
            }`}
          >
            <div
              className={`${
                message.role === "USER" ? "text-right" : "text-left"
              }`}
            >
              {showRoleLabel && (
                <p className="text-xs font-medium text-gray-400 mb-1 px-1">
                  {message.role}
                </p>
              )}
              <div
                className={`inline-block px-4 py-3 rounded-lg ${
                  message.role === "USER"
                    ? userBubbleColor
                    : message.isRfp
                    ? rfpBubbleColor
                    : assistantBubbleColor
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-left">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
