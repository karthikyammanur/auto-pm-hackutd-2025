'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface OkrAgentData {
  summary?: string;
  analysis?: string;
  question?: string;
  fileName?: string;
  generatedAt?: string;
}

interface OkrAgentViewProps {
  spaceId: string;
  okrAgentData: OkrAgentData | null;
  onComplete: () => void;
  isViewingPastStep?: boolean;
}

export default function OkrAgentView({
  spaceId,
  okrAgentData,
  onComplete,
  isViewingPastStep
}: OkrAgentViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<OkrAgentData | null>(okrAgentData);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [actionType, setActionType] = useState<'summary' | 'question'>('question');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleRunAgent = async () => {
    if (!file) {
      setError('Please upload a PDF file');
      return;
    }

    if (actionType === 'question' && !question.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (actionType === 'summary') {
        formData.append('action', 'summary');
      } else {
        formData.append('question', question);
      }

      const response = await fetch(`/api/spaces/${spaceId}/run-okr-agent`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run OKR agent');
      }

      const result = await response.json();
      setData(result.data);
      setIsEditing(false);
      onComplete();
    } catch (err) {
      console.error('Error running OKR agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to run OKR agent');
    } finally {
      setIsRunning(false);
    }
  };

  const handleEditMode = () => {
    setIsEditing(true);
    setQuestion(data?.question || '');
    setFile(null);
    setActionType(data?.summary ? 'summary' : 'question');
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setQuestion('');
    setFile(null);
    setActionType('question');
    setError(null);
  };

  // Edit mode - show form with existing data
  if (data && isEditing) {
    return (
      <div>
        {/* Edit Mode Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
              <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                Edit & Rerun OKR Analysis
              </h3>
              <p className="text-sm" style={{ color: '#6B6B6B' }}>
                Update your document or question and generate a new analysis.
              </p>
            </div>
          </div>

          {/* Previous File Info */}
          {data.fileName && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FAFAFA', border: '1px solid #E5E5E5' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#6B6B6B' }}>
                Previous File:
              </p>
              <p className="text-sm" style={{ color: '#1A1A1A' }}>
                {data.fileName}
              </p>
            </div>
          )}

          {/* Action Type Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block" style={{ color: '#1A1A1A' }}>
              What would you like to do?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setActionType('question')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  actionType === 'question' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: actionType === 'question' ? 'rgba(155, 107, 122, 0.08)' : '#FAFAFA',
                  color: actionType === 'question' ? '#9B6B7A' : '#6B6B6B',
                  border: `1px solid ${actionType === 'question' ? '#9B6B7A' : '#E5E5E5'}`,
                }}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ask a Question
              </button>
              <button
                onClick={() => setActionType('summary')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  actionType === 'summary' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: actionType === 'summary' ? 'rgba(155, 107, 122, 0.08)' : '#FAFAFA',
                  color: actionType === 'summary' ? '#9B6B7A' : '#6B6B6B',
                  border: `1px solid ${actionType === 'summary' ? '#9B6B7A' : '#E5E5E5'}`,
                }}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Summary
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block" style={{ color: '#1A1A1A' }}>
              Upload New OKR Document
            </label>
            <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
              Upload a PDF file containing your OKR document
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 hover:border-rose-300"
              style={{
                borderColor: file ? '#9B6B7A' : '#E5E5E5',
                backgroundColor: file ? 'rgba(155, 107, 122, 0.02)' : '#FAFAFA',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: '#6B6B6B' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto mb-3" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>
                    Click to upload PDF
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    or drag and drop
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Question Input (only if action is 'question') */}
          {actionType === 'question' && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block" style={{ color: '#1A1A1A' }}>
                Your Question
              </label>
              <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
                Ask a specific question about the OKR document
              </p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., What are the Q2 engineering objectives? What is the target for user growth?"
                className="w-full px-4 py-3 rounded-lg text-sm resize-vertical transition-all duration-200"
                style={{
                  border: '1px solid #E5E5E5',
                  color: '#1A1A1A',
                  minHeight: '100px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9B6B7A';
                  e.target.style.boxShadow = '0 0 0 4px rgba(155, 107, 122, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E5E5';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  {question.length} characters
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}>
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAgent}
              disabled={isRunning || !file || (actionType === 'question' && !question.trim())}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: isRunning ? '#9CA3AF' : '#9B6B7A',
                color: '#FFFFFF',
              }}
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {actionType === 'summary' ? 'Generating Summary...' : 'Analyzing Question...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Rerun Analysis
                </>
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isRunning}
              className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
              style={{
                backgroundColor: '#FAFAFA',
                color: '#6B6B6B',
                border: '1px solid #E5E5E5',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {/* Run Agent Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(155, 107, 122, 0.08)' }}>
              <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                OKR Planning & Analysis
              </h3>
              <p className="text-sm" style={{ color: '#6B6B6B' }}>
                Upload your OKR document (PDF) and ask questions or generate a comprehensive summary.
              </p>
            </div>
          </div>

          {/* Action Type Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block" style={{ color: '#1A1A1A' }}>
              What would you like to do?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setActionType('question')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  actionType === 'question' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: actionType === 'question' ? 'rgba(155, 107, 122, 0.08)' : '#FAFAFA',
                  color: actionType === 'question' ? '#9B6B7A' : '#6B6B6B',
                  border: `1px solid ${actionType === 'question' ? '#9B6B7A' : '#E5E5E5'}`,
                }}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ask a Question
              </button>
              <button
                onClick={() => setActionType('summary')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  actionType === 'summary' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: actionType === 'summary' ? 'rgba(155, 107, 122, 0.08)' : '#FAFAFA',
                  color: actionType === 'summary' ? '#9B6B7A' : '#6B6B6B',
                  border: `1px solid ${actionType === 'summary' ? '#9B6B7A' : '#E5E5E5'}`,
                }}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Summary
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block" style={{ color: '#1A1A1A' }}>
              Upload OKR Document
            </label>
            <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
              Upload a PDF file containing your OKR document
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 hover:border-rose-300"
              style={{
                borderColor: file ? '#9B6B7A' : '#E5E5E5',
                backgroundColor: file ? 'rgba(155, 107, 122, 0.02)' : '#FAFAFA',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8" style={{ color: '#9B6B7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: '#6B6B6B' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto mb-3" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>
                    Click to upload PDF
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    or drag and drop
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Question Input (only if action is 'question') */}
          {actionType === 'question' && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block" style={{ color: '#1A1A1A' }}>
                Your Question
              </label>
              <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
                Ask a specific question about the OKR document
              </p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., What are the Q2 engineering objectives? What is the target for user growth?"
                className="w-full px-4 py-3 rounded-lg text-sm resize-vertical transition-all duration-200"
                style={{
                  border: '1px solid #E5E5E5',
                  color: '#1A1A1A',
                  minHeight: '100px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9B6B7A';
                  e.target.style.boxShadow = '0 0 0 4px rgba(155, 107, 122, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E5E5';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  {question.length} characters
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}>
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleRunAgent}
            disabled={isRunning || !file || (actionType === 'question' && !question.trim())}
            className="w-full px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: isRunning ? '#9CA3AF' : '#9B6B7A',
              color: '#FFFFFF',
            }}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {actionType === 'summary' ? 'Generating Summary...' : 'Analyzing Question...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {actionType === 'summary' ? 'Generate OKR Summary' : 'Analyze Question'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Viewing Past Step Banner */}
        {isViewingPastStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" style={{ color: '#3B82F6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm" style={{ color: '#1E40AF' }}>
              You're viewing a completed step.
            </p>
          </div>
        )}

        {/* OKR Analysis Results */}
        <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #E5E5E5' }}>
          <div className="p-6 border-b" style={{ borderColor: '#E5E5E5' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                  OKR Analysis
                </h2>
                {data.fileName && (
                  <div className="flex items-center gap-2 text-xs mb-2" style={{ color: '#6B6B6B' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{data.fileName}</span>
                  </div>
                )}
                {data.generatedAt && (
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Generated {new Date(data.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditMode}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: 'rgba(155, 107, 122, 0.08)',
                    color: '#9B6B7A',
                    border: '1px solid rgba(155, 107, 122, 0.2)',
                  }}
                  title="Edit and rerun"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium">Edit & Rerun</span>
                </button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                  Completed
                </div>
              </div>
            </div>
          </div>

          {/* Question Display (if applicable) */}
          {data.question && (
            <div className="p-6 border-b" style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B6B6B' }}>
                Question:
              </p>
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                {data.question}
              </p>
            </div>
          )}

          {/* Analysis/Summary Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-bold mb-4 mt-6" style={{ color: '#1A1A1A' }} {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-semibold mb-3 mt-5" style={{ color: '#1A1A1A' }} {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold mb-2 mt-4" style={{ color: '#1A1A1A' }} {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-base font-semibold mb-2 mt-3" style={{ color: '#1A1A1A' }} {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-sm leading-relaxed mb-4" style={{ color: '#1A1A1A' }} {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-sm" style={{ color: '#1A1A1A' }} {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold" style={{ color: '#9B6B7A' }} {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic" style={{ color: '#6B6B6B' }} {...props} />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="px-1.5 py-0.5 rounded text-xs font-mono"
                      style={{ backgroundColor: '#F5F5F7', color: '#9B6B7A' }}
                      {...props}
                    />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 pl-4 py-2 my-4 italic"
                      style={{ borderColor: '#9B6B7A', backgroundColor: '#FAFAFA', color: '#6B6B6B' }}
                      {...props}
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full border-collapse" style={{ border: '1px solid #E5E5E5' }} {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead style={{ backgroundColor: '#FAFAFA' }} {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: '#6B6B6B', border: '1px solid #E5E5E5' }} {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-4 py-2 text-sm" style={{ color: '#1A1A1A', border: '1px solid #E5E5E5' }} {...props} />
                  ),
                }}
              >
                {data.summary || data.analysis || ''}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

