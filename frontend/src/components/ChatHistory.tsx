import { MessageSquare, Clock, Loader2 } from "lucide-react";

interface Chat {
  id: string;
  createdAt: string;
  rfp?: {
    status: string;
  };
}

interface ChatHistoryProps {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  onChatSelect: (id: string) => void;
}

const ChatHistory = ({
  chats,
  loading,
  error,
  onChatSelect,
}: ChatHistoryProps) => {
  return (
    <div className="flex-1 overflow-y-auto px-3">
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 uppercase font-semibold">
        <Clock className="w-4 h-4" />
        Chat History
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : error ? (
        <div className="px-3 py-4 text-sm text-red-400">{error}</div>
      ) : chats.length === 0 ? (
        <div className="px-3 py-4 text-sm text-gray-500">
          No chat history yet
        </div>
      ) : (
        <div className="space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-left hover:bg-gray-800/50 text-gray-300 group cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium truncate">
                    Chat #{chat.id}
                  </div>

                  {chat.rfp?.status && (
                    <span className="text-xs whitespace-nowrap flex-shrink-0">
                      {chat.rfp.status}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
