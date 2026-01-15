import React, { useState, useEffect } from "react";
import { X, Mail, Loader2, ChevronRight } from "lucide-react";
import instance from "../lib/axios";
import ProposalDetailModal from "./ProposalDetailModal";

interface Proposal {
  id: string;
  emailSubject: string;
  emailFrom: string;
  rawEmailBody: string;
}

interface ProposalListModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
}

const ProposalListModal: React.FC<ProposalListModalProps> = ({
  isOpen,
  onClose,
  sessionId,
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchProposals();
    }
  }, [isOpen, sessionId]);

  const fetchProposals = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await instance.get(`/proposal/mails/${sessionId}`);

      if (response.data.success) {
        setProposals(response.data.mails);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposalClick = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProposalId(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Vendor Proposals
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
            ) : proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Mail className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No reply from vendors</p>
                <p className="text-sm mt-2">
                  Check back later for vendor proposals
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    onClick={() => handleProposalClick(proposal.id)}
                    className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition-colors border border-gray-600 hover:border-blue-500 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-sm text-gray-400 truncate">
                            {proposal.emailFrom}
                          </span>
                        </div>
                        <h3 className="text-white font-medium truncate">
                          {proposal.emailSubject}
                        </h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-4" />
                    </div>
                  </button>
                ))}
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

      {/* Proposal Detail Modal */}
      {selectedProposalId && (
        <ProposalDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          proposalId={selectedProposalId}
        />
      )}
    </>
  );
};

export default ProposalListModal;
