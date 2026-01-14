import React, { useState, useEffect } from "react";
import { Mail, Edit2, Check, Loader2 } from "lucide-react";
import instance from "../lib/axios";

interface RfpData {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

interface RfpPreviewProps {
  rfpData: RfpData;
  sessionId: string | null;
  onFinalized?: () => void;
}

const RfpPreview: React.FC<RfpPreviewProps> = ({
  rfpData,
  sessionId,
  onFinalized,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(rfpData.title);
  const [description, setDescription] = useState(rfpData.description);
  const [isChanged, setIsChanged] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    setTitle(rfpData.title);
    setDescription(rfpData.description);
    setIsChanged(false);
    setIsEditing(false);
  }, [rfpData]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsChanged(true);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
    setIsChanged(true);
  };

  const handleFinalize = async () => {
    if (!sessionId) {
      console.error("No session ID available");
      return;
    }

    setIsFinalizing(true);
    try {
      const response = await instance.post("/rfp/finalized", {
        sessionId,
        title,
        description,
        isChanged,
      });

      if (response.data.success) {
        setIsEditing(false);
        if (onFinalized) {
          onFinalized();
        }
      }
    } catch (error) {
      console.error("Error finalizing RFP:", error);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">RFP Preview</h2>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          {isEditing ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm">Done</span>
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </>
          )}
        </button>
      </div>

      {/* Email Preview */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Email Header */}
          <div className="bg-gray-750 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-400 min-w-[60px]">
                Subject:
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="flex-1 text-white font-medium">{title}</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>

          {/* Email Body */}
          <div className="px-6 py-6">
            {isEditing ? (
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                rows={12}
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{ minHeight: "300px" }}
              />
            ) : (
              <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Change Indicator */}
        {isChanged && (
          <div className="mt-4 px-4 py-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
            <p className="text-sm text-yellow-400">
              You have unsaved changes. Click "Finalize" to save.
            </p>
          </div>
        )}
      </div>

      {/* Finalize Button */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <button
          onClick={handleFinalize}
          disabled={isFinalizing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isFinalizing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Finalizing...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Finalize RFP</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RfpPreview;
