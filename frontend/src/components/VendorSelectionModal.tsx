import React, { useState, useEffect } from "react";
import { X, Mail, Check, Loader2 } from "lucide-react";
import instance from "../lib/axios";

interface Vendor {
  id: string;
  name: string;
  email: string;
}

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (selectedVendorIds: string[]) => void;
  isSending: boolean;
}

const VendorSelectionModal: React.FC<VendorSelectionModalProps> = ({
  isOpen,
  onClose,
  onSend,
  isSending,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await instance.get("/rfp/vendors");
      if (response.data.success) {
        setVendors(response.data.vendors || []);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendors. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const handleSend = () => {
    if (selectedVendors.size > 0) {
      onSend(Array.from(selectedVendors));
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setSelectedVendors(new Set());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Select Vendors</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSending}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3">
              <p className="text-red-400">{error}</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No vendors available</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-4">
                Select at least one vendor to send the RFP
              </p>
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => toggleVendor(vendor.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedVendors.has(vendor.id)
                      ? "bg-blue-900/30 border-blue-600"
                      : "bg-gray-750 border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedVendors.has(vendor.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-500"
                    }`}
                  >
                    {selectedVendors.has(vendor.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {vendor.name}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {vendor.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            {selectedVendors.size > 0 ? (
              <span>
                {selectedVendors.size} vendor
                {selectedVendors.size > 1 ? "s" : ""} selected
              </span>
            ) : (
              <span>No vendors selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={selectedVendors.size === 0 || isSending}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send RFP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSelectionModal;
