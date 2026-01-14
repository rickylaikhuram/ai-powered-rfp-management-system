import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatHistory from "./ChatHistory";
import instance from "../lib/axios";

interface Chat {
  id: string;
  createdAt: string;
  rfp?: {
    status: string;
  };
}

// Sidebar Component
const Sidebar = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get("/rfp/history");

      if (data?.success) {
        setChats(data.chatHistory ?? []);
      } else {
        setError(data?.message || "Failed to load chat history");
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setError("Error fetching chat history");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    navigate("/");
  };

  const handleChatSelect = (id: string) => {
    navigate(`/${id}`);
  };

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-screen">
      {/* New RFP Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New RFP</span>
        </button>
      </div>

      {/* Chat History Component */}
      <ChatHistory
        chats={chats}
        loading={loading}
        error={error}
        onChatSelect={handleChatSelect}
      />
    </div>
  );
};

export default Sidebar;
