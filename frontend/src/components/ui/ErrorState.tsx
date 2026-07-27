"use client";

import React from "react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="error-state-card">
      <div className="error-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="var(--aws-color-error)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <h3 className="error-title">Failed to load data</h3>
      <p className="error-message">{message}</p>
      
      {onRetry && (
        <button className="btn-secondary error-retry-btn" onClick={onRetry}>
          Retry
        </button>
      )}

      <style jsx>{`
        .error-state-card {
          padding: 40px;
          text-align: center;
          background-color: #fdf2f2;
          border: 1px solid var(--aws-color-error);
          border-radius: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .error-icon {
          font-size: 32px;
          color: var(--aws-color-error);
          margin-bottom: 12px;
        }
        .error-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--aws-color-error);
          margin-bottom: 8px;
        }
        .error-message {
          font-size: 13px;
          color: var(--aws-text-secondary);
          max-width: 450px;
          line-height: 20px;
          margin-bottom: 20px;
        }
        .error-retry-btn {
          padding: 6px 16px;
        }
      `}</style>
    </div>
  );
};
