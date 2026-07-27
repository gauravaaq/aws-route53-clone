"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DNSRecord, HostedZone, RecordType, ZoneEvent } from "@/lib/types";
import { RECORD_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { RecordCreateModal } from "@/components/records/RecordCreateModal";
import { RecordEditModal } from "@/components/records/RecordEditModal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export default function ZoneDetailPage() {
  const { zoneId } = useParams() as { zoneId: string };
  const router = useRouter();
  const { addToast } = useToast();

  // Zone info states
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneError, setZoneError] = useState<string | null>(null);

  // Records states
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordPages, setRecordPages] = useState(1);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // Audit logs states
  const [events, setEvents] = useState<ZoneEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Tab state: "records" or "activity"
  const [activeTab, setActiveTab] = useState<"records" | "activity">("records");

  // Query states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recordType, setRecordType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal toggles
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Targets
  const [selectedRecord, setSelectedRecord] = useState<DNSRecord | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Zone Info
  const fetchZoneDetails = useCallback(async () => {
    setZoneLoading(true);
    setZoneError(null);
    try {
      const data = await api.zones.get(zoneId);
      setZone(data);
    } catch (err: any) {
      setZoneError(err.message || "Failed to load hosted zone details.");
    } finally {
      setZoneLoading(false);
    }
  }, [zoneId]);

  // Fetch Records
  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const response = await api.records.list(zoneId, {
        search: debouncedSearch || undefined,
        type: recordType || undefined,
        page,
        limit
      });
      setRecords(response.data);
      setTotalRecords(response.meta.total);
      setRecordPages(response.meta.total_pages);
      setSelectedIds(new Set()); // Reset selections
    } catch (err: any) {
      setRecordsError(err.message || "Failed to load DNS records.");
    } finally {
      setRecordsLoading(false);
    }
  }, [zoneId, debouncedSearch, recordType, page, limit]);

  // Fetch Audit Events
  const fetchAuditEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await api.zones.events(zoneId);
      setEvents(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setEventsLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    fetchZoneDetails();
  }, [fetchZoneDetails]);

  useEffect(() => {
    if (activeTab === "records") {
      fetchRecords();
    } else {
      fetchAuditEvents();
    }
  }, [activeTab, fetchRecords, fetchAuditEvents]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(records.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  // Action Clickers
  const handleEditClick = () => {
    if (selectedIds.size !== 1) return;
    const targetId = Array.from(selectedIds)[0];
    const rec = records.find(r => r.id === targetId) || null;
    setSelectedRecord(rec);
    setEditOpen(true);
  };

  const handleDeleteClick = () => {
    if (selectedIds.size !== 1) return; // Support single delete for safety
    const targetId = Array.from(selectedIds)[0];
    const rec = records.find(r => r.id === targetId) || null;
    
    if (rec) {
      // Block deleting default NS/SOA at apex
      if (rec.name === zone?.name && ["NS", "SOA"].includes(rec.type)) {
        addToast("Action Blocked", `Default apex ${rec.type} records cannot be deleted.`, "error");
        return;
      }
      setSelectedRecord(rec);
      setDeleteOpen(true);
    }
  };

  const performDelete = async () => {
    if (!selectedRecord) return;
    try {
      await api.records.delete(zoneId, selectedRecord.id);
      addToast("Success", `Deleted ${selectedRecord.type} record for '${selectedRecord.name}'.`, "success");
      fetchRecords();
      fetchZoneDetails(); // Refresh zone record count
    } catch (err: any) {
      addToast("Error", err.message || "Failed to delete DNS record", "error");
    }
  };

  // Helper to format record values
  const formatRecordValue = (rec: DNSRecord) => {
    if (rec.value) return rec.value;
    if (rec.extra_json) {
      if (rec.type === "MX") {
        return `${rec.extra_json.priority} ${rec.extra_json.mail_server}`;
      }
      if (rec.type === "SRV") {
        return `${rec.extra_json.priority} ${rec.extra_json.weight} ${rec.extra_json.port} ${rec.extra_json.target}`;
      }
      if (rec.type === "CAA") {
        return `${rec.extra_json.flag} ${rec.extra_json.tag} "${rec.extra_json.value}"`;
      }
    }
    return "-";
  };

  const isAllSelected = records.length > 0 && selectedIds.size === records.length;
  const isSingleSelected = selectedIds.size === 1;

  if (zoneLoading) {
    return (
      <div className="content-body loading-details">
        <div className="skeleton-row" style={{ width: "30%", height: "24px", marginBottom: "20px" }} />
        <div className="skeleton-row" style={{ width: "100%", height: "120px" }} />
      </div>
    );
  }

  if (zoneError || !zone) {
    return (
      <div className="content-body">
        <ErrorState message={zoneError || "Hosted zone details not found."} onRetry={fetchZoneDetails} />
      </div>
    );
  }

  return (
    <div className="content-body">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/hosted-zones">Hosted zones</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{zone.name}</span>
      </div>

      {/* Summary Card */}
      <div className="zone-summary-card">
        <div className="summary-left">
          <h1 className="zone-title">{zone.name}</h1>
          <div className="zone-meta-tags">
            <span className={`badge badge-${zone.type}`}>{zone.type}</span>
            <span className="meta-item"><strong>ID:</strong> {zone.id}</span>
          </div>
          {zone.comment && <p className="zone-comment-text">{zone.comment}</p>}
        </div>
        
        <div className="summary-right">
          <div className="stat-box">
            <span className="stat-label">Records</span>
            <span className="stat-value">{zone.record_count}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === "records" ? "active" : ""}`}
          onClick={() => setActiveTab("records")}
        >
          Records
        </button>
        <button 
          className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          Recent Activity (Audit Logs)
        </button>
      </div>

      {/* Records Tab Content */}
      {activeTab === "records" && (
        <div className="table-container">
          <div className="table-header-actions">
            <div className="actions-left-dns">
              <input
                type="text"
                className="form-input search-input-dns"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search records by name or value"
              />
              <select
                className="form-select type-filter-select"
                value={recordType}
                onChange={(e) => { setRecordType(e.target.value); setPage(1); }}
              >
                <option value="">All record types</option>
                {RECORD_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            <div className="actions-right">
              <button
                className="btn-secondary"
                disabled={!isSingleSelected}
                onClick={handleEditClick}
              >
                Edit record
              </button>
              <button
                className="btn-secondary delete-action-btn"
                disabled={!isSingleSelected}
                onClick={handleDeleteClick}
              >
                Delete record
              </button>
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                Create record
              </button>
            </div>
          </div>

          {recordsError ? (
            <div className="table-error-wrap">
              <ErrorState message={recordsError} onRetry={fetchRecords} />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="aws-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        disabled={recordsLoading || records.length === 0}
                      />
                    </th>
                    <th>Record name</th>
                    <th>Type</th>
                    <th>TTL (Seconds)</th>
                    <th>Value / Route target</th>
                  </tr>
                </thead>
                <tbody>
                  {recordsLoading ? (
                    <LoadingSkeleton rows={5} cols={5} />
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <EmptyState
                          title={debouncedSearch || recordType ? "No matching records" : "No records"}
                          message={
                            debouncedSearch || recordType
                              ? "Try refining your filters or create a new DNS record."
                              : "Get started by creating records to route domain traffic."
                          }
                          ctaText={debouncedSearch || recordType ? undefined : "Create record"}
                          onCtaClick={debouncedSearch || recordType ? undefined : () => setCreateOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    records.map(rec => {
                      const isSelected = selectedIds.has(rec.id);
                      const isSystemApex = rec.name === zone.name && ["NS", "SOA"].includes(rec.type);
                      return (
                        <tr key={rec.id} className={isSelected ? "selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(rec.id)}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{rec.name}</td>
                          <td>
                            <span className="badge badge-dns-type">{rec.type}</span>
                            {isSystemApex && (
                              <span className="system-tag" title="System default record, delete protected">apex</span>
                            )}
                          </td>
                          <td>{rec.ttl}</td>
                          <td className="value-cell" title={formatRecordValue(rec)}>
                            {formatRecordValue(rec)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!recordsLoading && !recordsError && totalRecords > 0 && (
            <Pagination
              page={page}
              limit={limit}
              total={totalRecords}
              totalPages={recordPages}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          )}
        </div>
      )}

      {/* Activity Logs Tab Content */}
      {activeTab === "activity" && (
        <div className="activity-container">
          <div className="activity-card">
            <h3 className="activity-card-title">Recent Activity Logs</h3>
            <p className="activity-card-desc">Audit logs documenting creation, updates, and deletions of resources under hosted zone '{zone.name}'.</p>
            
            {eventsLoading ? (
              <div className="events-loading">
                <div className="auth-loading-spinner" />
                <p>Loading activity logs...</p>
              </div>
            ) : events.length === 0 ? (
              <p className="no-events-text">No logged events for this hosted zone.</p>
            ) : (
              <div className="events-timeline">
                {events.map(event => (
                  <div key={event.id} className="event-item">
                    <div className="event-time">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                    <div className="event-content">
                      <span className={`event-badge badge-${event.event_type.toLowerCase().includes("created") ? "created" : event.event_type.toLowerCase().includes("updated") ? "updated" : "deleted"}`}>
                        {event.event_type}
                      </span>
                      <p className="event-description">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Record Modal */}
      <RecordCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { fetchRecords(); fetchZoneDetails(); }}
        zone={zone}
      />

      {/* Edit Record Modal */}
      <RecordEditModal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setSelectedRecord(null); }}
        onSuccess={fetchRecords}
        zone={zone}
        record={selectedRecord}
      />

      {/* Delete Record Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedRecord(null); }}
        onConfirm={performDelete}
        title="Confirm Record Deletion"
        resourceName={selectedRecord?.name || ""}
        resourceType={`${selectedRecord?.type} record`}
      />

      <style jsx>{`
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 13px;
          color: var(--aws-text-secondary);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .breadcrumb-separator {
          color: #aab7b8;
        }
        .breadcrumb-current {
          color: var(--aws-text-primary);
          font-weight: 600;
        }
        .zone-summary-card {
          background-color: #ffffff;
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .zone-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--aws-text-primary);
          margin-bottom: 8px;
        }
        .zone-meta-tags {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }
        .meta-item {
          font-size: 13px;
          color: var(--aws-text-secondary);
        }
        .zone-comment-text {
          font-size: 13px;
          color: var(--aws-text-secondary);
        }
        .stat-box {
          border-left: 2px solid var(--aws-border);
          padding-left: 20px;
          text-align: right;
        }
        .stat-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--aws-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--aws-text-primary);
          line-height: 1;
        }
        .tab-bar {
          display: flex;
          border-bottom: 1px solid var(--aws-border);
          margin-bottom: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          color: var(--aws-text-secondary);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          border-radius: 0;
        }
        .tab-btn:hover {
          color: var(--aws-text-primary);
        }
        .tab-btn.active {
          color: var(--aws-border-active);
          border-bottom-color: var(--aws-border-active);
        }
        .actions-left-dns {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .search-input-dns {
          width: 280px;
        }
        .type-filter-select {
          width: 160px;
          padding: 7px 12px;
        }
        .system-tag {
          font-size: 9px;
          font-weight: 700;
          background-color: #fff3cd;
          color: #856404;
          padding: 1px 4px;
          border-radius: 2px;
          text-transform: uppercase;
          margin-left: 6px;
        }
        .value-cell {
          max-width: 450px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: monospace;
          color: var(--aws-text-secondary);
        }
        .table-error-wrap {
          padding: 20px;
        }
        
        /* Activity styling */
        .activity-card {
          background-color: #ffffff;
          border: 1px solid var(--aws-border);
          border-radius: 2px;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .activity-card-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .activity-card-desc {
          font-size: 13px;
          color: var(--aws-text-secondary);
          margin-bottom: 24px;
        }
        .events-loading {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--aws-text-secondary);
        }
        .no-events-text {
          font-size: 13px;
          color: var(--aws-text-secondary);
        }
        .events-timeline {
          border-left: 2px solid var(--aws-border);
          padding-left: 24px;
          margin-left: 12px;
        }
        .event-item {
          margin-bottom: 24px;
          position: relative;
        }
        .event-item::before {
          content: "";
          position: absolute;
          left: -31px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #ffffff;
          border: 2px solid var(--aws-border-active);
        }
        .event-time {
          font-size: 12px;
          font-weight: 700;
          color: var(--aws-text-secondary);
          margin-bottom: 4px;
        }
        .event-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .event-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 2px;
          text-transform: uppercase;
        }
        .badge-created { background-color: #d4edda; color: #155724; }
        .badge-updated { background-color: #cce5ff; color: #004085; }
        .badge-deleted { background-color: #f8d7da; color: #721c24; }
        .event-description {
          font-size: 13px;
          color: var(--aws-text-primary);
        }
      `}</style>
    </div>
  );
}
