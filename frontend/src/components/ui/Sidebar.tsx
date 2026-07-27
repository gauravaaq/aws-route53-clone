"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarGroup {
  title: string;
  items: {
    label: string;
    path: string;
    isComingSoon?: boolean;
  }[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const sidebarData: SidebarGroup[] = [
    {
      title: "Dashboard",
      items: [
        { label: "Dashboard", path: "/dashboard" }
      ]
    },
    {
      title: "DNS Management",
      items: [
        { label: "Hosted zones", path: "/hosted-zones" },
        { label: "Health checks", path: "/health-checks" },
        { label: "DNS Sandbox", path: "/dns-test" }
      ]
    },
    {
      title: "Traffic Management",
      items: [
        { label: "Traffic policies", path: "/traffic-policies" }
      ]
    },
    {
      title: "Resolver",
      items: [
        { label: "Inbound endpoints", path: "/resolver/inbound" },
        { label: "Outbound endpoints", path: "/resolver/outbound" }
      ]
    },
    {
      title: "Profiles",
      items: [
        { label: "Profiles", path: "/profiles" }
      ]
    }
  ];

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (path: string) => {
    if (path === "/hosted-zones" && pathname.startsWith("/hosted-zones")) {
      return true;
    }
    return pathname === path;
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="header-title">Route 53</span>
      </div>
      
      <div className="sidebar-menu-list">
        {sidebarData.map(group => {
          const isCollapsed = collapsedGroups[group.title];
          return (
            <div key={group.title} className="menu-group">
              <button className="group-toggle-btn" onClick={() => toggleGroup(group.title)}>
                <span className="caret">{isCollapsed ? "▶" : "▼"}</span>
                <span className="group-title-text">{group.title}</span>
              </button>
              
              {!isCollapsed && (
                <ul className="group-items">
                  {group.items.map(item => {
                    const active = isActive(item.path);
                    return (
                      <li key={item.label} className="menu-item-row">
                        {item.isComingSoon ? (
                          <Link href={item.path} className={`menu-item-link ${active ? "active" : ""}`}>
                            <span className="link-label">{item.label}</span>
                            <span className="coming-soon-tag">soon</span>
                          </Link>
                        ) : (
                          <Link href={item.path} className={`menu-item-link ${active ? "active" : ""}`}>
                            <span className="link-label">{item.label}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .sidebar {
          width: 240px;
          background-color: #ffffff;
          border-right: 1px solid var(--aws-border);
          display: flex;
          flex-direction: column;
          height: calc(100vh - 48px);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
        }
        .sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--aws-border);
        }
        .header-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--aws-text-primary);
        }
        .sidebar-menu-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 0;
        }
        .menu-group {
          margin-bottom: 8px;
        }
        .group-toggle-btn {
          width: 100%;
          text-align: left;
          padding: 8px 20px;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--aws-text-primary);
          font-weight: 700;
          font-size: 13px;
        }
        .group-toggle-btn:hover {
          background-color: #f2f3f3;
        }
        .caret {
          font-size: 8px;
          color: #aab7b8;
          width: 8px;
        }
        .group-title-text {
          letter-spacing: 0.2px;
        }
        .group-items {
          list-style: none;
          margin: 0;
          padding: 0 0 0 12px;
        }
        .menu-item-row {
          margin: 2px 0;
        }
        .menu-item-link {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 20px 8px 16px;
          font-size: 13px;
          color: var(--aws-text-secondary);
          border-left: 3px solid transparent;
          text-decoration: none !important;
        }
        .menu-item-link:hover {
          background-color: #f7f9f9;
          color: var(--aws-text-primary);
        }
        .menu-item-link.active {
          background-color: #ebf5fc;
          color: var(--aws-border-active);
          border-left-color: var(--aws-border-active);
          font-weight: 600;
        }
        .coming-soon-tag {
          font-size: 9px;
          font-weight: 700;
          background-color: #f2f3f3;
          color: #879596;
          padding: 1px 4px;
          border-radius: 2px;
          text-transform: uppercase;
        }
      `}</style>
    </nav>
  );
};
