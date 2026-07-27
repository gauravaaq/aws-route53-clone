"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { api } from "@/lib/api";
import { HostedZone } from "@/lib/types";

interface ZoneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zone: HostedZone | null;
}

export const ZoneEditModal: React.FC<ZoneEditModalProps> = ({ isOpen, onClose, onSuccess, zone }) => {
  const { addToast } = useToast();
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && zone) {
      setComment(zone.comment || "");
      setSaving(false);
    }
  }, [isOpen, zone]);

  const handleSave = async () => {
    if (!zone) return;
    
    setSaving(true);
    try {
      await api.zones.update(zone.id, {
        comment: comment.trim() || undefined
      });
      addToast("Success", `Hosted zone '${zone.name}' updated successfully.`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast("Error", err.message || "Failed to update hosted zone", "error");
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
        {saving ? "Saving..." : "Save changes"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit hosted zone: ${zone?.name}`} footer={footer}>
      <div className="zone-form">
        <div className="form-group">
          <label className="form-label" htmlFor="edit-zone-comment">Comment</label>
          <textarea
            id="edit-zone-comment"
            className="form-textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Main production domain records"
            disabled={saving}
          />
          <div className="form-helper">
            Modify the description for this hosted zone.
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
