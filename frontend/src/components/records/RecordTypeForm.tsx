"use client";

import React from "react";
import { CAA_TAGS } from "@/lib/constants";
import { RecordType } from "@/lib/types";

interface RecordTypeFormProps {
  type: RecordType;
  value: string;
  extraJson: Record<string, any>;
  errors: Record<string, string>;
  onChangeValue: (v: string) => void;
  onChangeExtra: (field: string, val: any) => void;
  disabled?: boolean;
}

export const RecordTypeForm: React.FC<RecordTypeFormProps> = ({
  type,
  value,
  extraJson,
  errors,
  onChangeValue,
  onChangeExtra,
  disabled = false
}) => {
  const isSimple = ["A", "AAAA", "CNAME", "TXT", "NS", "PTR"].includes(type);

  if (isSimple) {
    return (
      <div className="simple-type-form">
        <div className="form-group">
          <label className="form-label" htmlFor="record-value">
            Value
          </label>
          
          {type === "TXT" ? (
            <textarea
              id="record-value"
              className={`form-textarea ${errors.value ? "error" : ""}`}
              rows={3}
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder='"v=spf1 include:_spf.google.com ~all"'
              disabled={disabled}
              required
            />
          ) : (
            <input
              type="text"
              id="record-value"
              className={`form-input ${errors.value ? "error" : ""}`}
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder={
                type === "A" 
                  ? "192.0.2.44" 
                  : type === "AAAA" 
                  ? "2001:db8::1" 
                  : type === "CNAME"
                  ? "lb.provider.com."
                  : type === "NS"
                  ? "ns-1.awsdns.com."
                  : "www.example.com."
              }
              disabled={disabled}
              required
            />
          )}
          
          {errors.value && <div className="form-error">{errors.value}</div>}
          
          <div className="form-helper">
            {type === "A" && "Enter a single IPv4 address (e.g. 192.0.2.1)."}
            {type === "AAAA" && "Enter a single IPv6 address (e.g. 2001:db8::1)."}
            {type === "CNAME" && "Enter a target domain name. Must end with a trailing dot (e.g. my-balancer.amazon.com.)."}
            {type === "TXT" && "Enter text values. Wrap in double quotes (e.g. \"my-verification-key\"). Max 4096 characters."}
            {type === "NS" && "Enter nameserver hostname. Must end with a trailing dot (e.g. ns-1.awsdns.org.)."}
            {type === "PTR" && "Enter pointer target hostname. Must end with a trailing dot."}
          </div>
        </div>
      </div>
    );
  }

  // MX Compound Form
  if (type === "MX") {
    return (
      <div className="mx-form">
        <div className="form-row">
          <div className="form-group col-4">
            <label className="form-label" htmlFor="mx-priority">
              Priority
            </label>
            <input
              type="number"
              id="mx-priority"
              className={`form-input ${errors.priority ? "error" : ""}`}
              value={extraJson.priority ?? ""}
              onChange={(e) => onChangeExtra("priority", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="10"
              min={0}
              max={65535}
              disabled={disabled}
              required
            />
            {errors.priority && <div className="form-error">{errors.priority}</div>}
          </div>

          <div className="form-group col-8">
            <label className="form-label" htmlFor="mx-mail-server">
              Mail Server
            </label>
            <input
              type="text"
              id="mx-mail-server"
              className={`form-input ${errors.mail_server ? "error" : ""}`}
              value={extraJson.mail_server ?? ""}
              onChange={(e) => onChangeExtra("mail_server", e.target.value)}
              placeholder="mail.example.com."
              disabled={disabled}
              required
            />
            {errors.mail_server && <div className="form-error">{errors.mail_server}</div>}
          </div>
        </div>
        <div className="form-helper-row">
          MX records require a priority value (typically 10, 20, etc.) and the hostname of the receiving mail server ending with a trailing dot.
        </div>
        <style jsx>{`
          .form-row {
            display: flex;
            gap: 16px;
          }
          .col-4 { flex: 0 0 120px; }
          .col-8 { flex: 1; }
          .form-helper-row {
            font-size: 12px;
            color: var(--aws-text-secondary);
            margin-top: -12px;
            margin-bottom: 16px;
          }
        `}</style>
      </div>
    );
  }

  // SRV Compound Form
  if (type === "SRV") {
    return (
      <div className="srv-form">
        <div className="form-row-multi">
          <div className="form-group col-3">
            <label className="form-label" htmlFor="srv-priority">Priority</label>
            <input
              type="number"
              id="srv-priority"
              className={`form-input ${errors.priority ? "error" : ""}`}
              value={extraJson.priority ?? ""}
              onChange={(e) => onChangeExtra("priority", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="10"
              min={0}
              max={65535}
              disabled={disabled}
              required
            />
            {errors.priority && <div className="form-error">{errors.priority}</div>}
          </div>

          <div className="form-group col-3">
            <label className="form-label" htmlFor="srv-weight">Weight</label>
            <input
              type="number"
              id="srv-weight"
              className={`form-input ${errors.weight ? "error" : ""}`}
              value={extraJson.weight ?? ""}
              onChange={(e) => onChangeExtra("weight", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="5"
              min={0}
              max={65535}
              disabled={disabled}
              required
            />
            {errors.weight && <div className="form-error">{errors.weight}</div>}
          </div>

          <div className="form-group col-3">
            <label className="form-label" htmlFor="srv-port">Port</label>
            <input
              type="number"
              id="srv-port"
              className={`form-input ${errors.port ? "error" : ""}`}
              value={extraJson.port ?? ""}
              onChange={(e) => onChangeExtra("port", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="5060"
              min={0}
              max={65535}
              disabled={disabled}
              required
            />
            {errors.port && <div className="form-error">{errors.port}</div>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="srv-target">Target</label>
          <input
            type="text"
            id="srv-target"
            className={`form-input ${errors.target ? "error" : ""}`}
            value={extraJson.target ?? ""}
            onChange={(e) => onChangeExtra("target", e.target.value)}
            placeholder="sip.example.com."
            disabled={disabled}
            required
          />
          {errors.target && <div className="form-error">{errors.target}</div>}
          <div className="form-helper">
            Define service location. Target must end with a trailing dot (or use '.' to indicate service is unavailable).
          </div>
        </div>
        
        <style jsx>{`
          .form-row-multi {
            display: flex;
            gap: 16px;
            margin-bottom: 4px;
          }
          .col-3 { flex: 1; }
        `}</style>
      </div>
    );
  }

  // CAA Compound Form
  if (type === "CAA") {
    return (
      <div className="caa-form">
        <div className="form-row-multi">
          <div className="form-group col-4">
            <label className="form-label" htmlFor="caa-flag">Flag</label>
            <select
              id="caa-flag"
              className="form-select"
              value={extraJson.flag ?? 0}
              onChange={(e) => onChangeExtra("flag", Number(e.target.value))}
              disabled={disabled}
            >
              <option value={0}>0 (Non-critical)</option>
              <option value={128}>128 (Critical)</option>
            </select>
          </div>

          <div className="form-group col-8">
            <label className="form-label" htmlFor="caa-tag">Tag</label>
            <select
              id="caa-tag"
              className="form-select"
              value={extraJson.tag ?? "issue"}
              onChange={(e) => onChangeExtra("tag", e.target.value)}
              disabled={disabled}
            >
              {CAA_TAGS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="caa-value">Value (CA Domain Name)</label>
          <input
            type="text"
            id="caa-value"
            className={`form-input ${errors.caa_value ? "error" : ""}`}
            value={extraJson.value ?? ""}
            onChange={(e) => onChangeExtra("value", e.target.value)}
            placeholder="letsencrypt.org"
            disabled={disabled}
            required
          />
          {errors.caa_value && <div className="form-error">{errors.caa_value}</div>}
          <div className="form-helper">
            Name of the Certificate Authority (CA) authorized to issue certificates for your domain.
          </div>
        </div>

        <style jsx>{`
          .form-row-multi {
            display: flex;
            gap: 16px;
            margin-bottom: 4px;
          }
          .col-4 { flex: 0 0 150px; }
          .col-8 { flex: 1; }
        `}</style>
      </div>
    );
  }

  return null;
};
