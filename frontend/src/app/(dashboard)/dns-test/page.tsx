"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";

interface DnsAnswer {
  name: string;
  type: string;
  ttl: number;
  value: any;
}

interface DnsChainItem {
  name: string;
  type: string;
  value: string;
}

interface DnsResolveResponse {
  query_name: string;
  query_type: string;
  status: "NOERROR" | "NXDOMAIN" | "NODATA" | "SERVFAIL";
  answers: DnsAnswer[];
  chain: DnsChainItem[];
  dig_output: string;
  duration_ms: number;
}

export default function DnsTestPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DnsResolveResponse | null>(null);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Please specify a hostname query target.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await api.simulator.resolve(name, type);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to contact simulation resolver engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">DNS Sandbox Resolver</h1>
        <p className="page-description">
          Test and query your DNS record routing rules locally. This tool simulates a raw recursive resolver, resolving CNAME chasing chains, checking wildcard configurations, and outputting traditional UNIX <code>dig</code> diagnostics.
        </p>
      </div>

      <div className="sandbox-grid">
        {/* Left: Input Form */}
        <div className="sandbox-card">
          <h3 className="card-sec-title">Run Simulation Query</h3>
          <form onSubmit={handleResolve} className="resolve-form">
            <div className="form-group">
              <label className="form-label" htmlFor="dns-name">Domain Name / Hostname</label>
              <input 
                type="text" 
                id="dns-name"
                className="form-input"
                placeholder="www.example.com"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
              <div className="form-helper">Query targets must reside inside or match your hosted zones suffix rules.</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dns-type">Query Type</label>
              <select 
                id="dns-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={loading}
              >
                <option value="A">A (IPv4 Routing)</option>
                <option value="AAAA">AAAA (IPv6 Routing)</option>
                <option value="CNAME">CNAME (Alias canonical mapping)</option>
                <option value="TXT">TXT (Text/SPF records)</option>
                <option value="MX">MX (Mail routing targets)</option>
                <option value="NS">NS (Nameserver delegations)</option>
                <option value="SRV">SRV (Service locator records)</option>
                <option value="CAA">CAA (Certificate Authorities flags)</option>
                <option value="PTR">PTR (Reverse pointer records)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Resolving DNS..." : "Simulate DNS Resolution Query"}
            </button>
          </form>
          
          {error && (
            <div className="sandbox-error-block">
              <strong>Query Execution Failed:</strong>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right: Results / DIG Terminal */}
        <div className="sandbox-results-panel">
          {!result && !loading && (
            <div className="results-placeholder">
              <div className="ph-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--aws-text-secondary)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h4>Resolution Console Ready</h4>
              <p>Type a hostname target and run query to inspect DNS routing paths and query times.</p>
            </div>
          )}

          {loading && (
            <div className="results-placeholder">
              <div className="spinner-loader" />
              <h4>Traversing Record Tables...</h4>
              <p>Evaluating CNAME exclusivity mappings, wildcard overrides, and computing delegation sets...</p>
            </div>
          )}

          {result && (
            <div className="results-container">
              {/* Header metrics */}
              <div className="result-metrics-bar">
                <div className="metric-box">
                  <span className="lbl">Status</span>
                  <span className={`val badge-status ${result.status.toLowerCase()}`}>
                    {result.status}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="lbl">Query Time</span>
                  <span className="val">{result.duration_ms} ms</span>
                </div>
                <div className="metric-box">
                  <span className="lbl">Answers Recvd</span>
                  <span className="val">{result.answers.length}</span>
                </div>
              </div>

              {/* Visual Resolution Chain */}
              {result.chain && result.chain.length > 0 && (
                <div className="resolution-chain-section">
                  <h4 className="sec-lbl">Recursive Lookup Path:</h4>
                  <div className="chain-flow-diagram">
                    {result.chain.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="chain-step-node">
                          <span className="step-domain">{step.name}</span>
                          <span className="step-type-badge">{step.type}</span>
                          <span className="step-target">{typeof step.value === 'object' ? JSON.stringify(step.value) : step.value}</span>
                        </div>
                        {idx < result.chain.length - 1 && (
                          <div className="chain-step-connector">&rarr;</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Dig Output Code Box */}
              <div className="dig-terminal-wrap">
                <div className="terminal-header">
                  <span className="bullet red"></span>
                  <span className="bullet yellow"></span>
                  <span className="bullet green"></span>
                  <span className="terminal-title">cli / dig output diagnostic</span>
                </div>
                <pre className="dig-output">
                  {result.dig_output}
                </pre>
              </div>
            </div>
          )}
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
        .sandbox-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 992px) {
          .sandbox-grid {
            grid-template-columns: 1fr;
          }
        }
        .sandbox-card {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 24px;
        }
        .card-sec-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 16px;
        }
        .resolve-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .w-100 { width: 100%; }
        .sandbox-error-block {
          margin-top: 16px;
          background-color: #fdf2f2;
          border: 1px solid var(--aws-color-error);
          border-radius: 2px;
          padding: 12px;
          font-size: 12px;
        }
        .sandbox-error-block strong {
          color: var(--aws-color-error);
          display: block;
          margin-bottom: 2px;
        }
        .sandbox-error-block p {
          color: #545b64;
        }
        
        /* Results Panel */
        .sandbox-results-panel {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        .results-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
          color: var(--aws-text-secondary);
        }
        .ph-icon {
          margin-bottom: 16px;
        }
        .results-placeholder h4 {
          font-size: 16px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 8px;
        }
        .results-placeholder p {
          font-size: 13px;
          max-width: 400px;
          line-height: 20px;
        }
        
        /* Spinner Loader */
        .spinner-loader {
          border: 3px solid var(--aws-border);
          border-top: 3px solid var(--aws-border-active);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Results Content */
        .results-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .result-metrics-bar {
          display: flex;
          gap: 16px;
          border-bottom: 1px solid var(--aws-border);
          padding-bottom: 16px;
        }
        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .metric-box .lbl {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--aws-text-secondary);
        }
        .metric-box .val {
          font-size: 18px;
          font-weight: 800;
          color: var(--aws-text-primary);
        }
        .badge-status {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 2px;
          width: fit-content;
        }
        .badge-status.noerror { background-color: #d4edda; color: #155724; }
        .badge-status.nxdomain { background-color: #f8d7da; color: #721c24; }
        .badge-status.nodata { background-color: #fff3cd; color: #856404; }
        .badge-status.servfail { background-color: #f8d7da; color: #721c24; }
        
        /* Chain Flow */
        .resolution-chain-section {
          background-color: var(--aws-bg-body);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 16px;
        }
        .sec-lbl {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--aws-text-secondary);
          margin-bottom: 12px;
        }
        .chain-flow-diagram {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .chain-step-node {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 4px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 140px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }
        .step-domain {
          font-size: 12px;
          font-weight: 700;
          color: var(--aws-text-primary);
        }
        .step-type-badge {
          font-size: 9px;
          font-weight: 700;
          color: #ffffff;
          background-color: var(--aws-border-active);
          padding: 1px 4px;
          border-radius: 2px;
          width: fit-content;
          margin: 2px 0;
        }
        .step-target {
          font-family: monospace;
          font-size: 11px;
          color: var(--aws-text-secondary);
          word-break: break-all;
        }
        .chain-step-connector {
          color: var(--aws-text-secondary);
          font-weight: 800;
          font-size: 18px;
        }
        
        /* Terminal */
        .dig-terminal-wrap {
          border-radius: 4px;
          overflow: hidden;
          background-color: #0f172a;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .terminal-header {
          background-color: #1e293b;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .bullet.red { background-color: #ef4444; }
        .bullet.yellow { background-color: #eab308; }
        .bullet.green { background-color: #22c55e; }
        .terminal-title {
          font-family: monospace;
          font-size: 11px;
          color: #94a3b8;
          margin-left: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dig-output {
          padding: 16px;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 18px;
          color: #38bdf8;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
}
