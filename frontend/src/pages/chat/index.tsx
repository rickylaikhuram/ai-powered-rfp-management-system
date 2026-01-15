import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowDown, Recycle, Check } from "lucide-react";
import instance from "../../lib/axios";
import RfpPreview from "../../components/RfpPreview";
import ChatMessages from "../../components/ChatMessage";
import type { Message } from "../../types/chat";

interface RfpData {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  status: string;
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
  const [emailSent, setEmailSent] = useState(false);
  const [hasProposals, setHasProposals] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

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
      setEmailSent(false);
      setHasProposals(false);
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
          console.log(response.data.rfp);

          if (
            response.data.rfp.status === "SENT" ||
            response.data.rfp.status === "IN_PROGRESS" ||
            response.data.rfp.status === "CANCELLED"
          ) {
            setEmailSent(true);
          } else {
            setEmailSent(false);
          }

          // Check if proposals exist
          if (
            response.data.rfp.proposals &&
            response.data.rfp.proposals.length > 0
          ) {
            setHasProposals(true);
          } else {
            setHasProposals(false);
          }
        } else {
          setRfpData(null);
          setHasProposals(false);
        }
        setTimeout(() => scrollToBottom(true), 100);
      }
    } catch (error: any) {
      console.error("Error fetching chat history:", error);

      // If session doesn't exist, redirect to new
      if (error.response?.status === 404) {
        navigate("/new", { replace: true });
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
        navigate(`/${newSessionId}`, { replace: true });
      }

      // Add AI response
      const aiMessage: Message = {
        role: "ASSISTANT",
        content: response.data.message.content,
        createdAt: new Date(),
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

  const handleCompare = async () => {
    if (!sessionId || isComparing) return;

    setIsComparing(true);
    try {
      const response = await instance.post("/proposal/compare", {
        sessionId: sessionId,
      });

      if (response.data.success) {
        // Add the comparison message to the chat
        const comparisonMessage: Message = {
          role: "ASSISTANT",
          content: response.data.message.content,
          createdAt: new Date(response.data.message.createdAt),
          isRfp: false,
        };

        setMessages((prev) => [...prev, comparisonMessage]);
        checkAndScroll();
      }
    } catch (error) {
      console.error("Error comparing proposals:", error);
    } finally {
      setIsComparing(false);
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
    setEmailSent(true);
    if (sessionId) {
      fetchChatHistory(sessionId);
    }
  };

  const handleSync = async () => {
    if (!sessionId) return;

    try {
      // First, call this endpoint to sync the mail from the mail account
      const response = await instance.get(`/proposal/mails/${sessionId}`);
      if (response.data.proposalExists) {
        setHasProposals(true);
      }
      // Then fetch the chat history to update the state
      await fetchChatHistory(sessionId);
    } catch (error) {
      console.error("Error syncing:", error);
    }
  };

  if (isFetchingHistory) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
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
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">RFP Assistant</h1>
          {emailSent && (
            <button
              onClick={handleSync}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white transition-colors cursor-pointer"
            >
              <Recycle className="w-4 h-4" />
              <span>Sync</span>
            </button>
          )}
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
            <ChatMessages messages={messages} />
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
          {emailSent ? (
            <button
              onClick={handleCompare}
              disabled={!hasProposals || isComparing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>
                    {!hasProposals
                      ? "No Proposals To Compare"
                      : "Compare Proposals"}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="max-w-4xl mx-auto flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  rfpData
                    ? "Ask ai to fix rfp..."
                    : "Describe your procurement needs..."
                }
                disabled={emailSent || isLoading}
                rows={1}
                className="flex-1 resize-none border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white disabled:bg-gray-800 disabled:cursor-not-allowed placeholder-gray-400"
                style={{ minHeight: "50px", maxHeight: "150px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || emailSent}
                className="bg-blue-600 text-white rounded-lg px-6 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RFP Preview Section */}
      {rfpData && (
        <div className="w-1/2">
          <RfpPreview
            emailSent={emailSent}
            rfpData={rfpData}
            sessionId={sessionId}
            onFinalized={handleRfpFinalized}
            hasProposals={hasProposals}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
