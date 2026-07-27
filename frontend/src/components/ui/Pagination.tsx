"use client";

import React from "react";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing {startItem} to {endItem} of {total} items
      </div>
      
      <div className="pagination-controls">
        <div className="limit-selector">
          <label htmlFor="limit-select">Page size:</label>
          <select
            id="limit-select"
            className="form-select limit-select"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="page-buttons">
          <button
            className="btn-secondary page-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            ◀ Prev
          </button>
          
          <span className="page-number-display">
            Page {page} of {totalPages || 1}
          </span>
          
          <button
            className="btn-secondary page-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next ▶
          </button>
        </div>
      </div>

      <style jsx>{`
        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-top: 1px solid var(--aws-border);
          background-color: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          flex-wrap: wrap;
          gap: 16px;
        }
        .pagination-info {
          font-size: 13px;
          color: var(--aws-text-secondary);
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .limit-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--aws-text-secondary);
        }
        .limit-select {
          padding: 4px 8px;
          width: auto;
          min-width: 60px;
        }
        .page-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .page-btn {
          padding: 4px 10px;
          font-size: 13px;
        }
        .page-number-display {
          font-size: 13px;
          color: var(--aws-text-primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
