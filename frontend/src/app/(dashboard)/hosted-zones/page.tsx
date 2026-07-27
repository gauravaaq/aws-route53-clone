"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { HostedZone } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ZoneCreateModal } from "@/components/zones/ZoneCreateModal";
import { ZoneEditModal } from "@/components/zones/ZoneEditModal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export default function HostedZonesPage() {
  const { addToast } = useToast();
  
  // Data states
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal toggle states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Currently target zone for edit/delete
  const [selectedZone, setSelectedZone] = useState<HostedZone | null>(null);

  // Search debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch hosted zones
  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.zones.list({
        search: debouncedSearch || undefined,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setZones(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.total_pages);
      setSelectedIds(new Set()); // Reset selection on page reload
    } catch (err: any) {
      setError(err.message || "Failed to load hosted zones.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Sort callback
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(zones.map(z => z.id)));
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

  // Actions
  const handleEditClick = () => {
    if (selectedIds.size !== 1) return;
    const targetId = Array.from(selectedIds)[0];
    const zone = zones.find(z => z.id === targetId) || null;
    setSelectedZone(zone);
    setEditOpen(true);
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    
    if (selectedIds.size === 1) {
      const targetId = Array.from(selectedIds)[0];
      const zone = zones.find(z => z.id === targetId) || null;
      setSelectedZone(zone);
    } else {
      // Bulk delete indicator
      setSelectedZone({
        id: "bulk",
        name: "DELETE MULTIPLE ZONES",
        type: "public",
        comment: "",
        record_count: 0,
        created_at: "",
        updated_at: ""
      });
    }
    setDeleteOpen(true);
  };

  const performDelete = async () => {
    if (!selectedZone) return;
    
    if (selectedZone.id === "bulk") {
      // Bulk delete operation
      const ids = Array.from(selectedIds);
      let successCount = 0;
      let failCount = 0;
      
      for (const id of ids) {
        try {
          await api.zones.delete(id);
          successCount++;
        } catch (e) {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        addToast("Bulk Deletion", `Successfully deleted ${successCount} hosted zones.`, "success");
      }
      if (failCount > 0) {
        addToast("Bulk Deletion Error", `Failed to delete ${failCount} hosted zones.`, "error");
      }
    } else {
      // Single delete operation
      await api.zones.delete(selectedZone.id);
      addToast("Success", `Hosted zone '${selectedZone.name}' was deleted.`, "success");
    }
    
    fetchZones();
  };

  const isAllSelected = zones.length > 0 && selectedIds.size === zones.length;
  const isAnySelected = selectedIds.size > 0;
  const isSingleSelected = selectedIds.size === 1;

  return (
    <div className="content-body">
      <div className="page-header">
        <h1 className="page-title">Hosted zones</h1>
        <p className="page-description">
          A hosted zone is a container for records, which define how you want to route traffic for a domain and its subdomains.
        </p>
      </div>

      <div className="table-container">
        <div className="table-header-actions">
          <div className="actions-left">
            <input
              type="text"
              className="form-input search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter hosted zones by name"
            />
          </div>
          
          <div className="actions-right">
            <button
              className="btn-secondary"
              disabled={!isSingleSelected}
              onClick={handleEditClick}
            >
              Edit comment
            </button>
            <button
              className="btn-secondary delete-action-btn"
              disabled={!isAnySelected}
              onClick={handleDeleteClick}
            >
              Delete
            </button>
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              Create hosted zone
            </button>
          </div>
        </div>

        {error ? (
          <div className="table-error-wrap">
            <ErrorState message={error} onRetry={fetchZones} />
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
                      disabled={loading || zones.length === 0}
                    />
                  </th>
                  <th onClick={() => handleSort("name")}>
                    Hosted zone name {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("type")}>
                    Type {sortBy === "type" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th>Comment</th>
                  <th onClick={() => handleSort("record_count")} style={{ textAlign: "right" }}>
                    Record count {sortBy === "record_count" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <LoadingSkeleton rows={5} cols={5} />
                ) : zones.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <EmptyState
                        title={debouncedSearch ? "No matching hosted zones" : "No hosted zones"}
                        message={
                          debouncedSearch 
                            ? "Try refining your filter keyword or create a new hosted zone." 
                            : "Create a hosted zone to start managing records and routing policies."
                        }
                        ctaText={debouncedSearch ? undefined : "Create hosted zone"}
                        onCtaClick={debouncedSearch ? undefined : () => setCreateOpen(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  zones.map(zone => {
                    const isSelected = selectedIds.has(zone.id);
                    return (
                      <tr key={zone.id} className={isSelected ? "selected" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(zone.id)}
                          />
                        </td>
                        <td>
                          <Link href={`/hosted-zones/${zone.id}`} className="zone-link">
                            {zone.name}
                          </Link>
                        </td>
                        <td>
                          <span className={`badge badge-${zone.type}`}>
                            {zone.type}
                          </span>
                        </td>
                        <td className="comment-cell">{zone.comment || "-"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {zone.record_count}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 && (
          <Pagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      {/* Create Modal */}
      <ZoneCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchZones}
      />

      {/* Edit Modal */}
      <ZoneEditModal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setSelectedZone(null); }}
        onSuccess={fetchZones}
        zone={selectedZone}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedZone(null); }}
        onConfirm={performDelete}
        title={selectedZone?.id === "bulk" ? "Confirm Bulk Deletion" : "Confirm Deletion"}
        resourceName={selectedZone?.name || ""}
        resourceType={selectedZone?.id === "bulk" ? "multiple zones confirmation phrase" : "hosted zone"}
      />

      <style jsx>{`
        .page-header {
          margin-bottom: 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
          max-width: 900px;
          line-height: 20px;
        }
        .search-input {
          width: 320px;
        }
        .actions-right {
          display: flex;
          gap: 12px;
        }
        .zone-link {
          font-weight: 600;
          color: var(--aws-text-link);
        }
        .zone-link:hover {
          color: var(--aws-text-link-hover);
        }
        .comment-cell {
          color: var(--aws-text-secondary);
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .table-error-wrap {
          padding: 20px;
        }
      `}</style>
    </div>
  );
}
