"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { api } from "@/lib/api";

interface ZoneCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ZoneCreateModal: React.FC<ZoneCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setName("");
      setType("public");
      setComment("");
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = "Domain name is required.";
    } else {
      // Basic domain check
      const parts = trimmedName.replace(/\.$/, "").split(".");
      if (parts.length < 2) {
        newErrors.name = "Enter a valid domain name (e.g. example.com).";
      } else {
        const labelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
        for (const label of parts) {
          if (!label) {
            newErrors.name = "Domain labels cannot be empty.";
            break;
          }
          if (label.length > 63) {
            newErrors.name = "Domain labels cannot exceed 63 characters.";
            break;
          }
          if (!labelRegex.test(label)) {
            newErrors.name = "Domain label can only contain letters, numbers, and hyphens, and cannot start/end with a hyphen.";
            break;
          }
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const createdZone = await api.zones.create({
        name,
        type,
        comment: comment.trim() || undefined
      });
      addToast("Success", `Hosted zone '${createdZone.name}' created successfully.`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        addToast("Error", err.message || "Failed to create hosted zone", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <button className="btn-secondary" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "Creating..." : "Create hosted zone"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create hosted zone" footer={footer}>
      <div className="zone-form">
        <div className="form-group">
          <label className="form-label" htmlFor="zone-name">Domain name</label>
          <input
            type="text"
            id="zone-name"
            className={`form-input ${errors.name ? "error" : ""}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="example.com"
            disabled={saving}
            required
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
          <div className="form-helper">
            Enter the domain name for this hosted zone. A trailing dot (.) will be automatically appended if omitted.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="zone-type">Type</label>
          <select
            id="zone-type"
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as "public" | "private")}
            disabled={saving}
          >
            <option value="public">Public hosted zone</option>
            <option value="private">Private hosted zone</option>
          </select>
          <div className="form-helper">
            Public zones route internet traffic. Private zones route traffic within one or more Amazon VPCs.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="zone-comment">Comment - <em>optional</em></label>
          <textarea
            id="zone-comment"
            className="form-textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Main production domain records"
            disabled={saving}
          />
          <div className="form-helper">
            Provide a short description for this hosted zone.
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .zone-form {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}</style>
    </Modal>
  );
};
