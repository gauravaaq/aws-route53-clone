"use client";

import React from "react";

export default function ProfilesPage() {
  const profiles = [
    { id: "prof-1", name: "enterprise-core-dns-profile", status: "Associated", vpcs: ["vpc-0a1b2c3d (Main Hub)", "vpc-2e3f4g5h (Spoke-A)"], rules: 5, zones: 3 }
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Route 53 Profiles</h1>
        <p className="page-description">
          Route 53 Profiles let you group DNS configurations (hosted zones, resolver rules, and DNS Firewalls) and apply them to multiple VPCs within your AWS accounts.
        </p>
      </div>

      <div className="table-container">
        <div className="table-header-actions">
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--aws-text-secondary)" }}>
            Profiles List ({profiles.length})
          </span>
        </div>

        <div className="table-responsive">
          <table className="aws-table">
            <thead>
              <tr>
                <th>Profile ID</th>
                <th>Profile Name</th>
                <th>Status</th>
                <th>Associated VPCs</th>
                <th style={{ textAlign: "right" }}>Resolver Rules</th>
                <th style={{ textAlign: "right" }}>Private Hosted Zones</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id}>
                  <td><code>{p.id}</code></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><span className="status-badge active">● {p.status}</span></td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {p.vpcs.map(v => (
                        <code key={v} style={{ fontSize: "12px" }}>{v}</code>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{p.rules}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{p.zones}</td>
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
        .status-badge.active { color: var(--aws-color-success); font-weight: 700; font-size: 13px; }
      `}</style>
    </div>
  );
}
