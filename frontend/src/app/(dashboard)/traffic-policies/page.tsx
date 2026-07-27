"use client";

import React from "react";

export default function TrafficPoliciesPage() {
  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Traffic policies</h1>
        <p className="page-description">
          Traffic policies allow you to write complex routing rules (such as geo-routing, latency splits, and failovers) using visual design trees. Associated records are updated globally.
        </p>
      </div>

      <div className="policy-container">
        {/* Policy Details Summary */}
        <div className="policy-summary-card">
          <div>
            <h3 className="summary-title">global-geo-routing-policy</h3>
            <span className="badge badge-public">Version 1 (Active)</span>
          </div>
          <div className="summary-desc">
            Routes queries to regional server clusters depending on client geographic location. Prevents global latency bottlenecks.
          </div>
        </div>

        {/* Visual Policy Designer Mock */}
        <div className="designer-panel">
          <div className="designer-header">
            <span className="dot active">●</span> Traffic Policy Builder Preview
          </div>
          
          <div className="visual-tree-canvas">
            {/* Start Node */}
            <div className="tree-node start-node">
              <span className="node-badge">Start</span>
              <div className="node-text">DNS Entry: <code>traffic.example.com</code></div>
            </div>

            <div className="tree-connector">↓</div>

            {/* Split Node */}
            <div className="tree-node split-node">
              <span className="node-badge rule">Geolocation Rule</span>
              <div className="node-text">Evaluate Client IP Country Origin</div>
            </div>

            <div className="branches-container">
              {/* Branch 1 */}
              <div className="branch-col">
                <div className="branch-line">┌─[ North America ]</div>
                <div className="tree-node leaf-node">
                  <span className="node-badge endpoint">IP Endpoint</span>
                  <div className="node-text">US-East Servers<br /><code>198.51.100.12</code></div>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="branch-col">
                <div className="branch-line">├─[ Europe & Africa ]</div>
                <div className="tree-node leaf-node">
                  <span className="node-badge endpoint">IP Endpoint</span>
                  <div className="node-text">EU-Central Servers<br /><code>203.0.113.88</code></div>
                </div>
              </div>

              {/* Branch 3 */}
              <div className="branch-col">
                <div className="branch-line">└─[ Default / Global ]</div>
                <div className="tree-node failover-node">
                  <span className="node-badge failover">Failover Group</span>
                  <div className="node-text">Global Balancer<br /><code>192.0.2.1</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
        .policy-summary-card {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 20px 24px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .summary-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--aws-text-primary);
          display: inline-block;
          margin-right: 12px;
        }
        .summary-desc {
          font-size: 13px;
          color: var(--aws-text-secondary);
          line-height: 20px;
        }
        
        /* Designer Mock */
        .designer-panel {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .designer-header {
          background-color: #fafafa;
          border-bottom: 1px solid var(--aws-border);
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 700;
          color: var(--aws-text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        [data-theme="dark"] .designer-header {
          background-color: #0f172a;
        }
        .designer-header .dot {
          color: var(--aws-color-success);
        }
        .visual-tree-canvas {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--aws-bg-body);
          overflow-x: auto;
        }
        .tree-node {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 4px;
          padding: 16px 20px;
          min-width: 240px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          position: relative;
        }
        .node-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          background-color: #232f3e;
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 2px;
          letter-spacing: 0.5px;
        }
        .node-badge.rule { background-color: var(--aws-border-active); }
        .node-badge.endpoint { background-color: var(--aws-color-success); }
        .node-badge.failover { background-color: var(--aws-color-warning); }
        
        .node-text {
          font-size: 13px;
          color: var(--aws-text-primary);
          line-height: 18px;
        }
        .node-text code {
          background-color: var(--aws-bg-body);
          padding: 1px 4px;
          border-radius: 2px;
          font-size: 12px;
          border: 1px solid var(--aws-border);
        }
        
        .tree-connector {
          color: var(--aws-text-secondary);
          font-size: 24px;
          font-weight: 700;
          margin: 12px 0;
          user-select: none;
        }
        
        /* Branches alignment */
        .branches-container {
          display: flex;
          gap: 32px;
          margin-top: 24px;
          position: relative;
          justify-content: center;
          width: 100%;
          max-width: 800px;
        }
        .branch-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        .branch-line {
          font-family: monospace;
          color: var(--aws-text-secondary);
          font-size: 12px;
          margin-bottom: 12px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
