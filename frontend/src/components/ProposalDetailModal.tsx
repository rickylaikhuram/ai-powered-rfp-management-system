import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Loader2,
  DollarSign,
  Clock,
  Shield,
  Star,
} from "lucide-react";
import instance from "../lib/axios";

interface ProposalDetail {
  id: string;
  emailSubject: string;
  emailFrom: string;
  rawEmailBody: string;
  price?: number;
  deliveryDays?: number;
  warranty?: string;
  aiSummary?: string;
  aiScore?: number;
  createdAt?: string;
}

interface ProposalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string;
}

const ProposalDetailModal: React.FC<ProposalDetailModalProps> = ({
  isOpen,
  onClose,
  proposalId,
}) => {
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && proposalId) {
      fetchProposalDetail();
    }
  }, [isOpen, proposalId]);

  const fetchProposalDetail = async () => {
    setIsLoading(true);
    try {
      const response = await instance.get(
        `/proposal/mails/proposal/${proposalId}`
      );

      if (response.data.success) {
        setProposal(response.data.mails);
      }
    } catch (error) {
      console.error("Error fetching proposal detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              Proposal Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : proposal ? (
            <div className="space-y-6">
              {/* Email Header Info */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">
                      From:
                    </span>
                    <span className="text-white">{proposal.emailFrom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">
                      Subject:
                    </span>
                    <span className="text-white font-medium">
                      {proposal.emailSubject}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              {(proposal.aiScore !== undefined || proposal.aiSummary) && (
                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/50">
                  <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    AI Analysis
                  </h3>
                  <div className="space-y-3">
                    {proposal.aiScore !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Score:</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-700 rounded-full h-2 w-32">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${proposal.aiScore * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold">
                            {proposal.aiScore * 100}/100
                          </span>
                        </div>
                      </div>
                    )}
                    {proposal.aiSummary && (
                      <div>
                        <span className="text-sm text-gray-400 block mb-1">
                          Summary:
                        </span>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {proposal.aiSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Details Grid */}
              {(proposal.price !== undefined ||
                proposal.deliveryDays !== undefined ||
                proposal.warranty) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {proposal.price !== undefined && (
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Price</span>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        ${proposal.price || "N/A"}
                      </p>
                    </div>
                  )}
                  {proposal.deliveryDays !== undefined && (
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Delivery</span>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {proposal.deliveryDays} days
                      </p>
                    </div>
                  )}
                  {proposal.warranty && (
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-400">Warranty</span>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {proposal.warranty}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Email Body */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-white font-semibold mb-3">Full Proposal</h3>
                <div className="bg-gray-800 rounded p-4 max-h-96 overflow-y-auto">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">
                    {proposal.rawEmailBody}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Mail className="w-12 h-12 mb-4 opacity-50" />
              <p>Failed to load proposal details</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetailModal;
