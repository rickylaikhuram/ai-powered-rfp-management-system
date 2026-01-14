import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowDown } from "lucide-react";
import instance from "../../lib/axios";
import RfpPreview from "../../components/RfpPreview";

interface Message {
  role: string;
  content: string;
  createdAt: Date;
  isRfp?: boolean;
}

interface RfpData {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [rfpData, setRfpData] = useState<RfpData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch chat history if id is not 'new'
  useEffect(() => {
    if (id && id !== "new") {
      fetchChatHistory(id);
      setSessionId(id);
    } else if (id === "new") {
      // Explicitly reset when going to 'new'
      setMessages([]);
      setSessionId(null);
      setInput("");
      setIsLoading(false);
      setShowScrollButton(false);
      setRfpData(null);
    }
  }, [id]);

  const fetchChatHistory = async (chatId: string) => {
    setIsFetchingHistory(true);
    try {
      const response = await instance.get(`/rfp/chat/${chatId}`);

      if (response.data.success) {
        setMessages(response.data.messages);
        // Check if there's RFP data in the history
        if (response.data.rfp) {
          setRfpData(response.data.rfp);
        } else {
          setRfpData(null);
        }
        setTimeout(() => scrollToBottom(true), 100);
      }
    } catch (error: any) {
      console.error("Error fetching chat history:", error);

      // If session doesn't exist, redirect to new
      if (error.response?.status === 404) {
        navigate("/rfp/chat/new", { replace: true });
      }
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "USER",
      content: input.trim(),
      createdAt: new Date(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await instance.post("/rfp/chat", {
        sessionId: sessionId,
        data: input.trim(),
      });

      // If this was a new chat, update the URL and sessionId
      if (!sessionId && response.data.sessionId) {
        const newSessionId = response.data.sessionId;
        setSessionId(newSessionId);
        navigate(`/rfp/chat/${newSessionId}`, { replace: true });
      }

      // Add AI response
      const aiMessage: Message = {
        role: "ASSISTANT",
        content: response.data.message?.content,
        createdAt: response.data.message?.createdAt || new Date(),
        isRfp: response.data.isRfp || false,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If response contains RFP data, update rfpData state
      if (response.data.isRfp && response.data.rfp) {
        setRfpData(response.data.rfp);
      }

      // Check if user is near bottom before scrolling
      checkAndScroll();
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage.content); // Restore input
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToBottom = (force = false) => {
    if (force) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollButton(false);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const checkAndScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      150;

    if (isNearBottom) {
      scrollToBottom(true);
    } else {
      setShowScrollButton(true);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      50;

    setShowScrollButton(!isAtBottom);
  };

  const handleRfpFinalized = () => {
    // Optional: Add any post-finalization logic here
    console.log("RFP finalized successfully");
  };

  if (isFetchingHistory) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Chat Section */}
      <div
        className={`flex flex-col ${
          rfpData ? "w-1/2" : "w-full"
        } transition-all duration-300`}
      >
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <h1 className="text-xl font-semibold text-white">RFP Assistant</h1>
        </div>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-900"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Start a conversation to create your RFP</p>
            </div>
          ) : (
            messages.map((message, index) => (
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
                    <p className="text-xs font-medium text-gray-400 mb-1 px-1">
                      {message.role === "USER" ? "You" : "Assistant"}
                    </p>
                    <div
                      className={`inline-block px-4 py-3 rounded-lg ${
                        message.role === "USER"
                          ? "bg-blue-600 text-white"
                          : message.isRfp
                          ? "bg-gray-800 border border-gray-700 text-gray-100"
                          : "bg-gray-800 border border-gray-700 text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-24 left-8 bg-gray-800 border border-gray-700 rounded-full p-3 shadow-lg hover:bg-gray-700 transition-colors z-10"
            style={{ left: rfpData ? "calc(25% - 24px)" : "32px" }}
          >
            <ArrowDown className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Input Area */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your procurement needs..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white disabled:bg-gray-800 disabled:cursor-not-allowed placeholder-gray-400"
              style={{ minHeight: "50px", maxHeight: "150px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white rounded-lg px-6 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RFP Preview Section */}
      {rfpData && (
        <div className="w-1/2">
          <RfpPreview
            rfpData={rfpData}
            sessionId={sessionId}
            onFinalized={handleRfpFinalized}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
