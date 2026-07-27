"use client";

import React from "react";
import Link from "next/link";

interface ComingSoonProps {
  featureName: string;
  description: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ featureName, description }) => {
  return (
    <div className="coming-soon-container">
      <div className="aws-card">
        <div className="card-badge">CONSTRUCTING</div>
        <h1 className="feature-title">{featureName}</h1>
        <p className="feature-description">{description}</p>
        
        <div className="divider" />
        
        <h3 className="section-title">What you can do in this prototype clone:</h3>
        <ul className="prototype-features">
          <li>
            <strong>Hosted Zones Management:</strong> Create, edit, list, and delete hosted zones with audit logs.
          </li>
          <li>
            <strong>DNS Records Management:</strong> Full CRUD on 9 record types (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA).
          </li>
          <li>
            <strong>Domain Validation:</strong> Real DNS logic (CNAME apex block, CNAME exclusivity, IP validations) runs on the FastAPI backend.
          </li>
        </ul>

        <div className="cta-box">
          <Link href="/hosted-zones">
            <button className="btn-primary">Go to Hosted Zones</button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .coming-soon-container {
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 120px);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .aws-card {
          background-color: #ffffff;
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          max-width: 650px;
          width: 100%;
          padding: 40px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .card-badge {
          display: inline-block;
          background-color: #fff8e1;
          color: #ffb300;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 2px;
          border: 1px solid #ffe082;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
        }
        .feature-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 12px;
        }
        .feature-description {
          color: var(--aws-text-secondary);
          font-size: 14px;
          line-height: 22px;
          margin-bottom: 24px;
        }
        .divider {
          height: 1px;
          background-color: var(--aws-border);
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 12px;
        }
        .prototype-features {
          list-style-type: none;
          padding-left: 0;
          margin-bottom: 32px;
        }
        .prototype-features li {
          font-size: 13px;
          color: var(--aws-text-secondary);
          margin-bottom: 10px;
          position: relative;
          padding-left: 20px;
        }
        .prototype-features li::before {
          content: "✓";
          color: var(--aws-color-success);
          position: absolute;
          left: 0;
          font-weight: bold;
        }
        .cta-box {
          display: flex;
          justify-content: flex-start;
        }
      `}</style>
    </div>
  );
};
