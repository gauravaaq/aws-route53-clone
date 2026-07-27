"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  resourceName: string;
  resourceType: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  resourceName,
  resourceType
}) => {
  const [typedConfirm, setTypedConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTypedConfirm("");
      setError(null);
      setDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete resource");
      setDeleting(false);
    }
  };

  const isConfirmed = typedConfirm === resourceName;

  const footer = (
    <>
      <button className="btn-secondary" onClick={onClose} disabled={deleting}>
        Cancel
      </button>
      <button
        className="btn-primary"
        style={{
          backgroundColor: isConfirmed ? "var(--aws-color-error)" : "#eaeded",
          borderColor: isConfirmed ? "var(--aws-color-error)" : "#eaeded",
          color: isConfirmed ? "#ffffff" : "#aab7b8",
          cursor: isConfirmed ? "pointer" : "not-allowed"
        }}
        onClick={handleConfirm}
        disabled={!isConfirmed || deleting}
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <div className="delete-confirm-body">
        <p className="warning-text">
          <strong>WARNING:</strong> This action cannot be undone. All records and configurations associated with this {resourceType} will be permanently deleted.
        </p>
        
        <p className="instruction">
          To confirm deletion, type the {resourceType} name <strong>{resourceName}</strong> below:
        </p>

        <input
          type="text"
          className="form-input"
          value={typedConfirm}
          onChange={(e) => setTypedConfirm(e.target.value)}
          placeholder={resourceName}
          disabled={deleting}
          autoFocus
        />

        {error && <div className="form-error delete-error">{error}</div>}
      </div>

      <style jsx>{`
        .delete-confirm-body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .warning-text {
          background-color: #fff8e1;
          border-left: 4px solid var(--aws-color-warning);
          padding: 12px;
          font-size: 13px;
          margin-bottom: 20px;
          color: #856404;
        }
        [data-theme="dark"] .warning-text {
          background-color: #1e1b15;
          color: #ffeeba;
          border-left-color: var(--aws-color-warning);
        }
        .instruction {
          font-size: 14px;
          margin-bottom: 12px;
          color: var(--aws-text-primary);
        }
        .delete-error {
          margin-top: 12px;
          padding: 8px;
          background-color: #fdf2f2;
          border: 1px solid var(--aws-color-error);
          border-radius: 2px;
        }
      `}</style>
    </Modal>
  );
};
