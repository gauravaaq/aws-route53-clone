"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { RecordTypeForm } from "./RecordTypeForm";
import { RECORD_TYPES, DEFAULT_TTL, TTL_OPTIONS } from "@/lib/constants";
import { api } from "@/lib/api";
import { HostedZone, RecordType } from "@/lib/types";

interface RecordCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zone: HostedZone;
}

export const RecordCreateModal: React.FC<RecordCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zone
}) => {
  const { addToast } = useToast();
  
  // Fields
  const [name, setName] = useState("");
  const [type, setType] = useState<RecordType>("A");
  const [ttl, setTtl] = useState(DEFAULT_TTL);
  const [value, setValue] = useState("");
  const [extraJson, setExtraJson] = useState<Record<string, any>>({});
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setName("");
      setType("A");
      setTtl(DEFAULT_TTL);
      setValue("");
      setExtraJson({});
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

  // When type changes, reset values
  useEffect(() => {
    setValue("");
    if (type === "MX") {
      setExtraJson({ priority: 10, mail_server: "" });
    } else if (type === "SRV") {
      setExtraJson({ priority: 10, weight: 5, port: 5060, target: "" });
    } else if (type === "CAA") {
      setExtraJson({ flag: 0, tag: "issue", value: "" });
    } else {
      setExtraJson({});
    }
    setErrors({});
  }, [type]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate record name (relative label checks)
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== "@") {
      const parts = trimmedName.split(".");
      const labelRegex = /^[a-zA-Z0-9_]([a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?$/;
      
      for (const label of parts) {
        if (label === "*") continue; // Wildcard label
        if (!label) {
          newErrors.name = "Subdomain labels cannot be empty.";
          break;
        }
        if (!labelRegex.test(label)) {
          newErrors.name = "Subdomain labels can only contain alphanumeric characters, underscores, and hyphens.";
          break;
        }
      }
    }

    // CNAME apex check
    if (type === "CNAME" && (trimmedName === "" || trimmedName === "@")) {
      newErrors.name = "CNAME records are not allowed at the zone apex (@).";
    }

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
          // Check quotes
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
    if (!validate()) return;
    
    setSaving(true);
    try {
      const isSimple = ["A", "AAAA", "CNAME", "TXT", "NS", "PTR"].includes(type);
      const recordPayload = {
        name: name.trim() || "@",
        type,
        ttl,
        value: isSimple ? value.trim() : undefined,
        extra_json: !isSimple ? extraJson : undefined
      };
      
      await api.records.create(zone.id, recordPayload);
      addToast("Success", `DNS record created successfully.`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        addToast("Error", err.message || "Failed to create DNS record", "error");
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
        {saving ? "Creating..." : "Create record"}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create record" footer={footer}>
      <div className="record-create-form">
        <div className="form-group">
          <label className="form-label" htmlFor="rec-name">Record name</label>
          <div className="record-name-input-group">
            <input
              type="text"
              id="rec-name"
              className={`form-input relative-name-input ${errors.name ? "error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="www"
              disabled={saving}
            />
            <span className="zone-suffix">.{zone.name}</span>
          </div>
          {errors.name && <div className="form-error">{errors.name}</div>}
          <div className="form-helper">
            Define subdomain name or leave empty / enter @ for zone apex ({zone.name}).
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="rec-type">Record type</label>
          <select
            id="rec-type"
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as RecordType)}
            disabled={saving}
          >
            {RECORD_TYPES.map(t => (
              <option key={t} value={t}>{t} - Route traffic</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="rec-ttl">TTL (Seconds)</label>
          <select
            id="rec-ttl"
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
          type={type}
          value={value}
          extraJson={extraJson}
          errors={errors}
          onChangeValue={setValue}
          onChangeExtra={onChangeExtra}
          disabled={saving}
        />
      </div>

      <style jsx>{`
        .record-create-form {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .record-name-input-group {
          display: flex;
          align-items: center;
        }
        .relative-name-input {
          flex: 1;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
        .zone-suffix {
          background-color: #fafafa;
          border: 1px solid #aab7b8;
          border-left: none;
          border-top-right-radius: 2px;
          border-bottom-right-radius: 2px;
          padding: 8px 12px;
          color: var(--aws-text-secondary);
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
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
