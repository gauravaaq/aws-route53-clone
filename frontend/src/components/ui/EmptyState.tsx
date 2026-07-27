"use client";

import React from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  ctaText,
  onCtaClick
}) => {
  return (
    <div className="empty-state-card">
      <div className="empty-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--aws-text-secondary)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
      
      {ctaText && onCtaClick && (
        <button className="btn-primary empty-cta" onClick={onCtaClick}>
          {ctaText}
        </button>
      )}

      <style jsx>{`
        .empty-state-card {
          padding: 48px;
          text-align: center;
          background-color: var(--aws-bg-card);
          border: 1px dashed var(--aws-border);
          border-radius: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .empty-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }
        .empty-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 8px;
        }
        .empty-message {
          font-size: 13px;
          color: var(--aws-text-secondary);
          max-width: 400px;
          line-height: 20px;
          margin-bottom: 20px;
        }
        .empty-cta {
          padding: 8px 20px;
        }
      `}</style>
    </div>
  );
};
