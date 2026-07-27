"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { HostedZone, ZoneEvent } from "@/lib/types";

export default function DashboardPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [recentEvents, setRecentEvents] = useState<ZoneEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const response = await api.zones.list({ limit: 100 });
        setZones(response.data);
        
        // Fetch events for first 3 zones to show aggregate activity
        const activeZones = response.data.slice(0, 3);
        const eventPromises = activeZones.map(z => api.zones.events(z.id).catch(() => []));
        const eventsResults = await Promise.all(eventPromises);
        
        // Flatten and sort events by created_at desc
        const allEvents = eventsResults.flat().sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setRecentEvents(allEvents.slice(0, 6));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  const totalRecordCount = zones.reduce((sum, z) => sum + z.record_count, 0);

  return (
    <div className="content-body">
      <div className="dashboard-header">
        <h1 className="page-title">Route 53 Dashboard</h1>
        <p className="page-description">
          Global DNS administration console. Monitor domain delegations, route maps, resolver endpoints, and configuration audit logs.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--aws-text-secondary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <div className="stat-card-content">
            <span className="card-lbl">Hosted zones</span>
            <span className="card-val">{loading ? "..." : zones.length}</span>
            <Link href="/hosted-zones" className="card-link">View all zones &rarr;</Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--aws-text-secondary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="stat-card-content">
            <span className="card-lbl">Total DNS Records</span>
            <span className="card-val">{loading ? "..." : totalRecordCount}</span>
            <span className="card-sub-txt">Active routing targets</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--aws-text-secondary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div className="stat-card-content">
            <span className="card-lbl">Health checks</span>
            <span className="card-val">2</span>
            <Link href="/health-checks" className="card-link font-green">● Healthy</Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--aws-text-secondary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
          </div>
          <div className="stat-card-content">
            <span className="card-lbl">Traffic policies</span>
            <span className="card-val">1</span>
            <Link href="/traffic-policies" className="card-link">View routing map &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Main Panel layout */}
      <div className="dashboard-grid">
        {/* Left Side: Mock Traffic graph + Event Logs */}
        <div className="grid-left">
          
          {/* Mock Charts */}
          <div className="dashboard-panel">
            <h3 className="panel-title">DNS Resolution Queries (Last 24 Hours)</h3>
            <p className="panel-subtitle">Aggregate query volume handled by Route 53 clone resolvers.</p>
            
            <div className="mock-chart-wrap">
              <div className="chart-bar-container">
                <div className="chart-bar bar-1" style={{ height: "45%" }}><span className="bar-val">4.5M</span></div>
                <div className="chart-bar bar-2" style={{ height: "60%" }}><span className="bar-val">6.0M</span></div>
                <div className="chart-bar bar-3" style={{ height: "85%" }}><span className="bar-val">8.5M</span></div>
                <div className="chart-bar bar-4" style={{ height: "50%" }}><span className="bar-val">5.0M</span></div>
                <div className="chart-bar bar-5" style={{ height: "70%" }}><span className="bar-val">7.0M</span></div>
                <div className="chart-bar bar-6" style={{ height: "95%" }}><span className="bar-val">9.5M</span></div>
                <div className="chart-bar bar-7" style={{ height: "75%" }}><span className="bar-val">7.5M</span></div>
              </div>
              <div className="chart-labels">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* Audit Event logs */}
          <div className="dashboard-panel">
            <h3 className="panel-title">Recent System Log Activities</h3>
            <p className="panel-subtitle">Recent configuration events triggered across your hosted zones.</p>
            
            {loading ? (
              <div className="panel-loading">Loading event records...</div>
            ) : recentEvents.length === 0 ? (
              <div className="panel-empty">No recent changes logged. Create records to populate logs.</div>
            ) : (
              <div className="panel-events-list">
                {recentEvents.map(evt => (
                  <div key={evt.id} className="event-row-item">
                    <span className="evt-timestamp">
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`evt-badge badge-${evt.event_type.toLowerCase().includes("created") ? "created" : evt.event_type.toLowerCase().includes("updated") ? "updated" : "deleted"}`}>
                      {evt.event_type}
                    </span>
                    <span className="evt-desc">{evt.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Actions + Info Panel */}
        <div className="grid-right">
          <div className="dashboard-panel bg-gradient">
            <h3 className="panel-title text-white">Quick Actions</h3>
            <div className="action-buttons-stack">
              <Link href="/hosted-zones">
                <button className="btn-primary w-100 mb-12">Create Hosted Zone</button>
              </Link>
              <Link href="/health-checks">
                <button className="btn-secondary w-100 mb-12">Manage Health Checks</button>
              </Link>
            </div>
          </div>

          <div className="dashboard-panel">
            <h3 className="panel-title">Keyboard Shortcuts</h3>
            <div className="shortcut-guide-list">
              <div className="shortcut-row">
                <kbd>/</kbd> or <kbd>Ctrl + K</kbd>
                <span>Focus search bar</span>
              </div>
              <div className="shortcut-row">
                <kbd>Shift + C</kbd>
                <span>Create zone / record</span>
              </div>
              <div className="shortcut-row">
                <kbd>Esc</kbd>
                <span>Close any open modal</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel">
            <h3 className="panel-title">System Status</h3>
            <div className="status-indicator-block">
              <div className="status-item">
                <span className="status-dot green"></span>
                <span>FastAPI Backend Server: <strong>Online</strong></span>
              </div>
              <div className="status-item">
                <span className="status-dot green"></span>
                <span>SQLite DB connection: <strong>Healthy</strong></span>
              </div>
              <div className="status-item">
                <span className="status-dot green"></span>
                <span>DNS Validator Engine: <strong>Active</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-header {
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
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .stat-icon-wrap {
          font-size: 28px;
          background-color: var(--aws-bg-body);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-card-content {
          display: flex;
          flex-direction: column;
        }
        .card-lbl {
          font-size: 12px;
          font-weight: 700;
          color: var(--aws-text-secondary);
          text-transform: uppercase;
        }
        .card-val {
          font-size: 24px;
          font-weight: 800;
          color: var(--aws-text-primary);
          margin: 2px 0;
        }
        .card-link {
          font-size: 12px;
          color: var(--aws-text-link);
          font-weight: 600;
        }
        .card-sub-txt {
          font-size: 12px;
          color: var(--aws-text-secondary);
        }
        .font-green {
          color: var(--aws-color-success) !important;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        .grid-left, .grid-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .dashboard-panel {
          background-color: var(--aws-bg-card);
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 24px;
        }
        .panel-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 4px;
        }
        .text-white {
          color: #ffffff !important;
        }
        .panel-subtitle {
          font-size: 12px;
          color: var(--aws-text-secondary);
          margin-bottom: 20px;
        }
        .bg-gradient {
          background: linear-gradient(135deg, #232f3e 0%, #1e293b 100%);
          border-color: #1a2530;
        }
        .action-buttons-stack {
          margin-top: 16px;
        }
        .w-100 { width: 100%; }
        .mb-12 { margin-bottom: 12px; }
        
        /* Chart CSS */
        .mock-chart-wrap {
          padding-top: 10px;
        }
        .chart-bar-container {
          height: 180px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          border-bottom: 1px solid var(--aws-border);
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        .chart-bar {
          background-color: var(--aws-border-active);
          width: 10%;
          border-top-left-radius: 2px;
          border-top-right-radius: 2px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 6px;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          transition: height 0.3s ease;
          position: relative;
        }
        .chart-bar:hover {
          background-color: var(--aws-text-link-hover);
        }
        .bar-val {
          position: absolute;
          top: -20px;
          color: var(--aws-text-secondary);
          font-size: 10px;
        }
        .chart-labels {
          display: flex;
          justify-content: space-between;
          color: var(--aws-text-secondary);
          font-size: 11px;
        }
        
        /* Event logs */
        .panel-loading, .panel-empty {
          font-size: 13px;
          color: var(--aws-text-secondary);
          text-align: center;
          padding: 20px 0;
        }
        .panel-events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .event-row-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          border-bottom: 1px solid var(--aws-border);
          padding-bottom: 8px;
        }
        .event-row-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .evt-timestamp {
          font-family: monospace;
          color: var(--aws-text-secondary);
          font-weight: 600;
        }
        .evt-desc {
          color: var(--aws-text-primary);
        }
        .evt-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 2px;
          text-transform: uppercase;
        }
        .badge-created { background-color: #d4edda; color: #155724; }
        .badge-updated { background-color: #cce5ff; color: #004085; }
        .badge-deleted { background-color: #f8d7da; color: #721c24; }
        
        /* Shortcuts list */
        .shortcut-guide-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .shortcut-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        kbd {
          background-color: var(--aws-bg-body);
          border: 1px solid var(--aws-border);
          border-radius: 3px;
          box-shadow: 0 1px 0 rgba(0,0,0,0.2);
          color: var(--aws-text-primary);
          display: inline-block;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.4;
          padding: 2px 5px;
          white-space: nowrap;
        }
        
        /* Status list */
        .status-indicator-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 13px;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.green {
          background-color: var(--aws-color-success);
        }
      `}</style>
    </div>
  );
}
