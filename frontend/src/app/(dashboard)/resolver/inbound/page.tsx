"use client";

import React from "react";

export default function ResolverInboundPage() {
  const endpoints = [
    { id: "in-1", name: "on-premises-dns-inbound", status: "Active", vpc: "vpc-0a1b2c3d (Corporate Main)", ips: ["10.0.1.15 (Subnet-A)", "10.0.2.33 (Subnet-B)"] },
    { id: "in-2", name: "staging-resolver-inbound", status: "Active", vpc: "vpc-9e8f7g6h (Staging)", ips: ["172.16.1.5 (Subnet-Staging-A)"] }
  ];

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Inbound resolver endpoints</h1>
        <p className="page-description">
          Inbound resolver endpoints allow DNS queries from your on-premises network or other remote networks to be forwarded and resolved within your AWS VPC.
        </p>
      </div>

      <div className="table-container">
        <div className="table-header-actions">
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--aws-text-secondary)" }}>
            Inbound Endpoints ({endpoints.length})
          </span>
        </div>

        <div className="table-responsive">
          <table className="aws-table">
            <thead>
              <tr>
                <th>Endpoint ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Associated VPC</th>
                <th>Allocated IP addresses</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map(ep => (
                <tr key={ep.id}>
                  <td><code>{ep.id}</code></td>
                  <td style={{ fontWeight: 600 }}>{ep.name}</td>
                  <td><span className="status-badge healthy">● {ep.status}</span></td>
                  <td><code>{ep.vpc}</code></td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {ep.ips.map(ip => (
                        <code key={ip} style={{ fontSize: "12px" }}>{ip}</code>
                      ))}
                    </div>
                  </td>
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
