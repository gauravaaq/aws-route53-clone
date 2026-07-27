"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, login, error, setError, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Restore theme preference
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Clear login errors on mount
    setError(null);
    if (user && !loading) {
      router.push("/hosted-zones");
    }
  }, [user, loading, router, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/hosted-zones");
    } catch (err) {
      // Error is caught and set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo-section">
          <div className="logo-img-wrap">
            <img 
              src="/aws-logo.svg" 
              alt="AWS Logo" 
              width="40" 
              height="40" 
            />
          </div>
          <span className="logo-text">Amazon Web Services</span>
        </div>
        
        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">to access your Route 53 Clone console</p>

        {error && (
          <div className="login-error-banner">
            <span className="error-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--aws-color-error)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </span>
            <div className="error-content">
              <strong>Sign-in failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              className={`form-input ${error ? "error" : ""}`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@route53.com"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label className="form-label" htmlFor="password">Password</label>
            </div>
            <input
              className={`form-input ${error ? "error" : ""}`}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={submitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary login-btn"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-divider" />
        
        <div className="login-footer-info">
          <p>Demo Console Credentials:</p>
          <div className="cred-details">
            <div><strong>Email:</strong> <code>admin@route53.com</code></div>
            <div><strong>Password:</strong> <code>admin123</code></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: var(--aws-bg-body);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 20px;
          transition: background-color 0.15s ease;
        }
        .login-card {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          width: 100%;
          max-width: 400px;
          padding: 32px 40px;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .login-logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .logo-img-wrap {
          display: flex;
          align-items: center;
        }
        .logo-text {
          font-weight: 700;
          font-size: 15px;
          color: var(--aws-text-secondary);
        }
        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 4px;
        }
        .login-subtitle {
          color: var(--aws-text-secondary);
          font-size: 13px;
          margin-bottom: 24px;
        }
        .login-error-banner {
          background-color: #fdf2f2;
          border: 1px solid var(--aws-color-error);
          border-left-width: 4px;
          border-radius: 2px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 13px;
        }
        .error-icon {
          font-size: 16px;
          line-height: 1;
        }
        .error-content strong {
          display: block;
          color: var(--aws-color-error);
          margin-bottom: 2px;
        }
        .error-content p {
          color: #545b64;
        }
        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .login-btn {
          width: 100%;
          padding: 10px;
          font-size: 15px;
          margin-top: 8px;
        }
        .login-divider {
          height: 1px;
          background-color: var(--aws-border);
          margin: 24px 0;
        }
        .login-footer-info {
          font-size: 13px;
          color: var(--aws-text-secondary);
          background-color: var(--aws-bg-body);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 12px 16px;
        }
        .login-footer-info p {
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--aws-text-primary);
        }
        .cred-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cred-details code {
          font-family: monospace;
          background-color: var(--aws-bg-card);
          padding: 2px 6px;
          border-radius: 2px;
          border: 1px solid var(--aws-border);
          color: var(--aws-border-active);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
