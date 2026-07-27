"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface HealthCheck {
  id: string;
  name: string;
  status: "Healthy" | "Unhealthy";
  type: string;
  target: string;
  threshold: number;
}

export default function HealthChecksPage() {
  const { addToast } = useState() as any; // We can use direct toast helper or mock
  const [toastList, setToastList] = useState<{id: string, text: string, type: string}[]>([]);
  
  const showToast = (text: string, type: "success" | "error") => {
    const id = Math.random().toString();
    setToastList(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToastList(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const [checks, setChecks] = useState<HealthCheck[]>([
    { id: "1", name: "production-api-monitor", status: "Healthy", type: "HTTPS", target: "api.example.com", threshold: 3 },
    { id: "2", name: "web-frontend-probe", status: "Healthy", type: "HTTPS", target: "www.example.com", threshold: 3 },
    { id: "3", name: "database-port-check", status: "Healthy", type: "TCP", target: "db.internal.corp", threshold: 2 }
  ]);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("HTTPS");
  const [target, setTarget] = useState("");
  const [threshold, setThreshold] = useState(3);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    if (!name || !target) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    
    setSaving(true);
    setTimeout(() => {
      const newCheck: HealthCheck = {
        id: Math.random().toString(36).substring(7),
        name,
        status: "Healthy",
        type,
        target,
        threshold
      };
      
      setChecks(prev => [...prev, newCheck]);
      showToast(`Health check '${name}' created successfully.`, "success");
      setCreateOpen(false);
      setName("");
      setTarget("");
      setSaving(false);
    }, 500);
  };

  const handleDelete = (id: string, name: string) => {
    setChecks(prev => prev.filter(c => c.id !== id));
    showToast(`Health check '${name}' was deleted.`, "success");
  };

  const footer = (
    <>
      <button className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</button>
      <button className="btn-primary" onClick={handleCreate} disabled={saving}>
        {saving ? "Creating..." : "Create health check"}
      </button>
    </>
  );

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Health checks</h1>
        <p className="page-description">
          Health checks monitor the health and performance of your web servers, endpoints, and other resources. You can configure DNS failover based on these check states.
        </p>
      </div>

      <div className="table-container">
        <div className="table-header-actions">
          <div className="actions-left">
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--aws-text-secondary)" }}>
              Active Health Monitors ({checks.length})
            </span>
          </div>
          <div className="actions-right">
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>Create health check</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="aws-table">
            <thead>
              <tr>
                <th>Health check name</th>
                <th>Status</th>
                <th>Type</th>
                <th>Target endpoint</th>
                <th style={{ textAlign: "right" }}>Failure threshold</th>
                <th style={{ textAlign: "center", width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {checks.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <span className="status-badge healthy">
                      ● {c.status}
                    </span>
                  </td>
                  <td><span className="badge badge-dns-type">{c.type}</span></td>
                  <td><code>{c.target}</code></td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{c.threshold} consecutive failures</td>
                  <td style={{ textAlign: "center" }}>
                    <button 
                      className="btn-danger-small"
                      onClick={() => handleDelete(c.id, c.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create health check" footer={footer}>
        <div className="hc-form">
          <div className="form-group">
            <label className="form-label" htmlFor="hc-name">Name</label>
            <input 
              type="text" 
              id="hc-name" 
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-endpoint-monitor"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hc-type">Monitor Type</label>
            <select 
              id="hc-type" 
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="HTTPS">HTTPS (SSL encrypted endpoint check)</option>
              <option value="HTTP">HTTP (Unencrypted endpoint check)</option>
              <option value="TCP">TCP (Port verification check)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hc-target">Domain or IP Target</label>
            <input 
              type="text" 
              id="hc-target" 
              className="form-input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="example.com"
            />
            <div className="form-helper">The system sends health checks probes to this target destination.</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hc-thresh">Failure Threshold</label>
            <input 
              type="number" 
              id="hc-thresh" 
              className="form-input"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              min={1}
              max={10}
            />
            <div className="form-helper">Number of consecutive failed checks before endpoint is marked unhealthy.</div>
          </div>
        </div>
      </Modal>

      {/* Toast Alert stack */}
      <div className="local-toast-container">
        {toastList.map(t => (
          <div key={t.id} className={`local-toast ${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" ? (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--aws-color-success)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--aws-color-error)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .page-header {
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 6px;
        }
        .page-description {
          color: var(--aws-text-secondary);
          font-size: 14px;
          line-height: 20px;
          max-width: 900px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 700;
        }
        .status-badge.healthy {
          color: var(--aws-color-success);
        }
        .btn-danger-small {
          background-color: transparent;
          border: 1px solid var(--aws-color-error);
          color: var(--aws-color-error);
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 2px;
          cursor: pointer;
        }
        .btn-danger-small:hover {
          background-color: #fdf2f2;
        }
        
        /* Local toast rules */
        .local-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 2000;
        }
        .local-toast {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-left: 4px solid var(--aws-color-success);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 12px 20px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--aws-text-primary);
          animation: slideIn 0.2s ease-out;
        }
        .local-toast.error {
          border-left-color: var(--aws-color-error);
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
