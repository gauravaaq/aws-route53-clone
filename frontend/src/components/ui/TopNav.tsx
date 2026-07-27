"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const currentTheme = savedTheme || "light";
    setTheme(currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, []);

  // Toggle theme handler
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        <div className="topnav-logo-wrap">
          <img src="/aws-logo.svg" alt="AWS Logo" width="24" height="24" style={{ display: "block" }} />
        </div>
        <span className="topnav-title">Route 53</span>
        <span className="topnav-divider">|</span>
        <span className="topnav-service-text">Console</span>
      </div>

      <div className="topnav-right">
        {/* Theme Toggle Button */}
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        <div className="topnav-region-select">
          <span className="region-indicator">●</span> Global
        </div>
        
        <div className="topnav-user-menu">
          <button className="user-dropdown-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span className="user-avatar">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <span className="user-name">{user?.name || user?.email}</span>
            <span className="dropdown-caret">▼</span>
          </button>
          
          {dropdownOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)} />
              <div className="user-dropdown-menu">
                <div className="dropdown-user-details">
                  <div className="detail-name">{user?.name || "AWS Admin"}</div>
                  <div className="detail-email">{user?.email}</div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item signout-btn" onClick={() => { setDropdownOpen(false); logout(); }}>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .topnav {
          height: 48px;
          background-color: var(--aws-nav-dark);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid #1a2530;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          z-index: 100;
        }
        .topnav-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .topnav-logo-wrap {
          display: flex;
          align-items: center;
        }
        .topnav-title {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.5px;
        }
        .topnav-divider {
          color: #354457;
          font-size: 16px;
        }
        .topnav-service-text {
          font-size: 13px;
          color: #d1d5db;
        }
        .topnav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .theme-toggle-btn {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 6px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: background-color 0.1s ease;
        }
        .theme-toggle-btn:hover {
          background-color: var(--aws-nav-hover);
        }
        .topnav-region-select {
          font-size: 13px;
          color: #d1d5db;
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #1a2530;
          padding: 4px 10px;
          border-radius: 2px;
          border: 1px solid #354457;
        }
        .region-indicator {
          color: #4cd964;
          font-size: 10px;
        }
        .topnav-user-menu {
          position: relative;
        }
        .user-dropdown-btn {
          background: none;
          border: none;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 2px;
          cursor: pointer;
        }
        .user-dropdown-btn:hover {
          background-color: var(--aws-nav-hover);
        }
        .user-avatar {
          font-size: 14px;
        }
        .user-name {
          font-size: 13px;
          font-weight: 500;
        }
        .dropdown-caret {
          font-size: 8px;
          color: #aab7b8;
        }
        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
        }
        .user-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 6px;
          width: 220px;
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 20;
          color: var(--aws-text-primary);
          animation: dropdownFade 0.1s ease-out;
        }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-user-details {
          padding: 12px 16px;
        }
        .detail-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--aws-text-primary);
        }
        .detail-email {
          font-size: 12px;
          color: var(--aws-text-secondary);
          margin-top: 2px;
          word-break: break-all;
        }
        .dropdown-divider {
          height: 1px;
          background-color: var(--aws-border);
        }
        .dropdown-item {
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          font-size: 13px;
          background: none;
          border: none;
          color: var(--aws-text-primary);
          border-radius: 0;
          cursor: pointer;
        }
        .dropdown-item:hover {
          background-color: var(--aws-bg-body);
        }
        .signout-btn {
          color: var(--aws-color-error);
          font-weight: 600;
        }
      `}</style>
    </header>
  );
};
