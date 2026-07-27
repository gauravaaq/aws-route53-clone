"use client";

import React from "react";

export default function ResolverOutboundPage() {
  const rules = [
    { id: "rule-1", name: "forward-to-corporate-dns", status: "Active", domain: "corp.internal.", targets: ["192.168.10.15:53", "192.168.10.16:53"], vpc: "vpc-0a1b2c3d" },
    { id: "rule-2", name: "forward-to-active-directory", status: "Active", domain: "ad.example.local.", targets: ["10.100.5.10:53"], vpc: "vpc-0a1b2c3d" }
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Outbound resolver rules</h1>
        <p className="page-description">
          Outbound resolver rules define domain names and targets where queries originating inside your AWS VPC should be forwarded (e.g., to corporate active directory DNS servers).
        </p>
      </div>

      <div className="table-container">
        <div className="table-header-actions">
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--aws-text-secondary)" }}>
            Outbound Forwarding Rules ({rules.length})
          </span>
        </div>

        <div className="table-responsive">
          <table className="aws-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Rule Name</th>
                <th>Status</th>
                <th>Domain Pattern</th>
                <th>Target DNS Servers</th>
                <th>Associated VPC</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td><code>{r.id}</code></td>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td><span className="status-badge healthy">● {r.status}</span></td>
                  <td><strong>{r.domain}</strong></td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {r.targets.map(t => (
                        <code key={t}>{t}</code>
                      ))}
                    </div>
                  </td>
                  <td><code>{r.vpc}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style jsx>{`
        .page-header { margin-bottom: 24px; }
        .page-title { font-size: 24px; font-weight: 700; color: var(--aws-text-primary); margin-bottom: 6px; }
        .page-description { color: var(--aws-text-secondary); font-size: 14px; max-width: 900px; }
        .status-badge.healthy { color: var(--aws-color-success); font-weight: 700; font-size: 13px; }
      `}</style>
    </div>
  );
}
