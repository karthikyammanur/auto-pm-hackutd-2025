"use client";

import { useState, useEffect } from "react";

interface EditProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProblem: string;
  onSave: (newProblem: string) => void;
  isLoading: boolean;
}

export default function EditProblemModal({ 
  isOpen, 
  onClose, 
  currentProblem, 
  onSave, 
  isLoading 
}: EditProblemModalProps) {
  const [editedProblem, setEditedProblem] = useState(currentProblem);

  useEffect(() => {
    setEditedProblem(currentProblem);
  }, [currentProblem, isOpen]);

  const handleSave = () => {
    if (editedProblem.trim().length >= 10) {
      onSave(editedProblem);
    }
  };

  const handleCancel = () => {
    setEditedProblem(currentProblem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ border: '1px solid #E5E5E5' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#E5E5E5' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>
                Edit Problem Statement
              </h2>
              <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                Modify your problem statement and rerun the analysis
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" style={{ color: '#6B6B6B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <textarea
            value={editedProblem}
            onChange={(e) => setEditedProblem(e.target.value)}
            disabled={isLoading}
            className="w-full p-4 rounded-lg text-sm leading-relaxed resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              border: '1px solid #E5E5E5', 
              color: '#1A1A1A',
              minHeight: '200px',
            }}
            placeholder="Describe your problem or challenge..."
            autoFocus
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs" style={{ color: editedProblem.length < 10 ? '#EF4444' : '#9CA3AF' }}>
              {editedProblem.length} characters (minimum 10)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: '#E5E5E5' }}>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ color: '#6B6B6B' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || editedProblem.trim().length < 10}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isLoading ? '#9CA3AF' : '#9B6B7A',
              color: '#FFFFFF',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Save & Rerun'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

