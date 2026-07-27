"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { RecordTypeForm } from "./RecordTypeForm";
import { DEFAULT_TTL, TTL_OPTIONS } from "@/lib/constants";
import { api } from "@/lib/api";
import { HostedZone, DNSRecord } from "@/lib/types";

interface RecordEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zone: HostedZone;
  record: DNSRecord | null;
}

export const RecordEditModal: React.FC<RecordEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zone,
  record
}) => {
  const { addToast } = useToast();
  
  // Editable fields
  const [ttl, setTtl] = useState(DEFAULT_TTL);
  const [value, setValue] = useState("");
  const [extraJson, setExtraJson] = useState<Record<string, any>>({});
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && record) {
      setTtl(record.ttl);
      setValue(record.value || "");
      setExtraJson(record.extra_json || {});
      setErrors({});
      setSaving(false);
    }
  }, [isOpen, record]);

  const validate = (): boolean => {
    if (!record) return false;
    const newErrors: Record<string, string> = {};
    const type = record.type;

    // Type-specific field checks
    if (["A", "AAAA", "CNAME", "TXT", "NS", "PTR"].includes(type)) {
      if (!value.trim()) {
        newErrors.value = "Value is required.";
      } else {
        if (type === "A") {
          const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          if (!ipv4Regex.test(value.trim())) {
            newErrors.value = "Must be a valid IPv4 address (e.g. 192.0.2.235).";
          }
        } else if (type === "AAAA") {
          const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
          if (!ipv6Regex.test(value.trim())) {
            newErrors.value = "Must be a valid IPv6 address (e.g. 2001:db8::1).";
          }
        } else if (type === "CNAME" || type === "NS" || type === "PTR") {
          if (!value.trim().endsWith(".")) {
            newErrors.value = "Hostname value must end with a trailing dot (.)";
          }
        } else if (type === "TXT") {
          const val = value.trim();
          if (!val.startsWith('"') || !val.endsWith('"') || val.length < 2) {
            newErrors.value = "TXT record values must be wrapped in double quotes (e.g. \"value\").";
          }
        }
      }
    } else if (type === "MX") {
      const pri = extraJson.priority;
      const srv = extraJson.mail_server;
      
      if (pri === "" || pri === undefined) {
        newErrors.priority = "Priority is required.";
      } else if (Number(pri) < 0 || Number(pri) > 65535) {
        newErrors.priority = "Must be 0-65535.";
      }
      
      if (!srv || !srv.trim()) {
        newErrors.mail_server = "Mail server hostname is required.";
      } else if (!srv.trim().endsWith(".")) {
        newErrors.mail_server = "Hostname must end with a trailing dot (.)";
      }
    } else if (type === "SRV") {
      const pri = extraJson.priority;
      const wgt = extraJson.weight;
      const prt = extraJson.port;
      const tgt = extraJson.target;
      
      if (pri === "" || pri === undefined) newErrors.priority = "Priority required.";
      if (wgt === "" || wgt === undefined) newErrors.weight = "Weight required.";
      if (prt === "" || prt === undefined) newErrors.port = "Port required.";
      
      if (Number(pri) < 0 || Number(pri) > 65535) newErrors.priority = "Must be 0-65535.";
      if (Number(wgt) < 0 || Number(wgt) > 65535) newErrors.weight = "Must be 0-65535.";
      if (Number(prt) < 0 || Number(prt) > 65535) newErrors.port = "Must be 0-65535.";
      
      if (!tgt || !tgt.trim()) {
        newErrors.target = "Target hostname is required.";
      } else if (!tgt.trim().endsWith(".")) {
        newErrors.target = "Target must end with a trailing dot (.)";
      }
    } else if (type === "CAA") {
      const val = extraJson.value;
      if (!val || !val.trim()) {
        newErrors.caa_value = "CA value is required.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!record || !validate()) return;
    
    setSaving(true);
    try {
      const isSimple = ["A", "AAAA", "CNAME", "TXT", "NS", "PTR"].includes(record.type);
      const recordPayload = {
        ttl,
        value: isSimple ? value.trim() : undefined,
        extra_json: !isSimple ? extraJson : undefined
      };
      
      await api.records.update(zone.id, record.id, recordPayload);
      addToast("Success", `DNS record updated successfully.`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        addToast("Error", err.message || "Failed to update DNS record", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const onChangeExtra = (field: string, val: any) => {
    setExtraJson(prev => ({
      ...prev,
      [field]: val
    }));
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit record" footer={footer}>
      {record && (
        <div className="record-edit-form">
          <div className="form-group disabled-group">
            <label className="form-label" htmlFor="edit-rec-name">Record name</label>
            <input
              type="text"
              id="edit-rec-name"
              className="form-input disabled-input"
              value={record.name}
              disabled
            />
            <div className="form-helper">Record name cannot be changed after creation.</div>
          </div>

          <div className="form-group disabled-group">
            <label className="form-label" htmlFor="edit-rec-type">Record type</label>
            <input
              type="text"
              id="edit-rec-type"
              className="form-input disabled-input"
              value={`${record.type} - Route traffic`}
              disabled
            />
            <div className="form-helper">Record type cannot be changed after creation.</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-rec-ttl">TTL (Seconds)</label>
            <select
              id="edit-rec-ttl"
              className="form-select"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              disabled={saving}
            >
              {TTL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-divider" />

          <RecordTypeForm
            type={record.type}
            value={value}
            extraJson={extraJson}
            errors={errors}
            onChangeValue={setValue}
            onChangeExtra={onChangeExtra}
            disabled={saving}
          />
        </div>
      )}

      <style jsx>{`
        .record-edit-form {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .disabled-group {
          opacity: 0.7;
        }
        .disabled-input {
          background-color: #fafafa;
          cursor: not-allowed;
          border-color: #d5dadb;
        }
        .form-divider {
          height: 1px;
          background-color: var(--aws-border);
          margin: 20px 0;
        }
      `}</style>
    </Modal>
  );
};
