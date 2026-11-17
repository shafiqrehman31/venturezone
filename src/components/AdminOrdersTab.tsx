import { useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { ORDER_STEPS } from '../data/defaults';
import { OperationType, auth, db, handleFirestoreError } from '../lib/firebase';
import type {
  FormationOrder,
  OrderWorkflowStatus,
  ReportExport,
  ReportType,
} from '../types/domain';

interface AdminOrdersTabProps {
  orders: FormationOrder[];
  exportsHistory: ReportExport[];
  onSyncPipedrive: (order: FormationOrder) => Promise<void>;
  syncingOrderId: string | null;
}

export function AdminOrdersTab({
  orders,
  exportsHistory,
  onSyncPipedrive,
  syncingOrderId,
}: AdminOrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNoteOrder, setEditingNoteOrder] = useState<FormationOrder | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Reporting export state
  const [exportCadence, setExportCadence] = useState<'manual' | 'daily' | 'weekly'>('daily');
  const [exportType, setExportType] = useState<ReportType>('orders_csv');
  const [creatingReport, setCreatingReport] = useState(false);

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ord.fullName.toLowerCase().includes(q) ||
      ord.trackingCode.toLowerCase().includes(q) ||
      ord.whatsappNumber.toLowerCase().includes(q) ||
      ord.businessActivity.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  async function handleStatusChange(order: FormationOrder, newStatus: OrderWorkflowStatus) {
    const matchedStep = ORDER_STEPS.find((s) => s.status === newStatus)?.step || 1;
    setUpdatingId(order.id);

    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', order.id), {
      status: newStatus,
      currentStep: matchedStep,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'orderStatus', order.trackingCode), {
      status: newStatus,
      currentStep: matchedStep,
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNoteOrder) return;
    try {
      await updateDoc(doc(db, 'orders', editingNoteOrder.id), {
        notes: noteDraft.slice(0, 1000),
        updatedAt: serverTimestamp(),
      });
      setEditingNoteOrder(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${editingNoteOrder.id}`);
    }
  }

  function downloadFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleGenerateReport(
    type: ReportType,
    cadence: 'manual' | 'daily' | 'weekly',
    triggerDownload: boolean
  ) {
    setCreatingReport(true);
    const totalValueAed = orders.reduce((acc, o) => acc + (o.estimatedTotalAed || 0), 0);
    const dateStamp = new Date().toISOString().slice(0, 10);

    if (triggerDownload) {
      if (type === 'orders_csv') {
        const headers = [
          'Tracking Code',
          'Full Name',
          'Phone',
          'Email',
          'Jurisdiction',
          'Authority',
          'Activity',
          'Package',
          'Visas',
          'Total AED',
          'Status',
          'Step',
          'Pipedrive Sync',
          'Pipedrive Deal ID',
        ];
        const rows = orders.map((o) =>
          [
            o.trackingCode,
            `"${o.fullName.replace(/"/g, '""')}"`,
            `${o.countryCode}${o.whatsappNumber}`,
            o.email || '',
            o.jurisdiction,
            `"${o.authority.replace(/"/g, '""')}"`,
            `"${o.businessActivity.replace(/"/g, '""')}"`,
            `"${o.packageName.replace(/"/g, '""')}"`,
            o.visaCount,
            o.estimatedTotalAed,
            o.status,
            o.currentStep,
            o.pipedriveSyncStatus,
            o.pipedriveDealId || '',
          ].join(',')
        );
        downloadFile(
          `meridian-orders-${dateStamp}.csv`,
          [headers.join(','), ...rows].join('\n'),
          'text/csv;charset=utf-8;'
        );
      } else {
        const summary = {
          generatedAt: new Date().toISOString(),
          reportType: type,
          totalOrders: orders.length,
          totalPipelineAed: totalValueAed,
          pipedriveSynced: orders.filter((o) => o.pipedriveSyncStatus === 'synced').length,
          orders: orders.map((o) => ({
            trackingCode: o.trackingCode,
            fullName: o.fullName,
            jurisdiction: o.jurisdiction,
            packageName: o.packageName,
            estimatedTotalAed: o.estimatedTotalAed,
            status: o.status,
            pipedriveSyncStatus: o.pipedriveSyncStatus,
          })),
        };
        downloadFile(
          `meridian-${type}-${dateStamp}.json`,
          JSON.stringify(summary, null, 2),
          'application/json'
        );
      }
    }

    try {
      await addDoc(collection(db, 'reportExports'), {
        reportName: `${type.replace('_', ' ')} (${cadence}) — ${dateStamp}`,
        reportType: type,
        cadence,
        recordCount: orders.length,
        totalValueAed,
        generatedBy: auth.currentUser?.email || 'Admin',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reportExports');
    } finally {
      setCreatingReport(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Automated Management Reporting Exports */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-display text-base font-bold text-[#111827]">
              Management Reporting &amp; Automated Exports
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Download immediate CSV/JSON executive snapshots or configure recurring management report logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Report type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ReportType)}
              className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-[#111827]"
            >
              <option value="orders_csv">Orders Ledger (CSV)</option>
              <option value="analytics_summary">Executive Summary (JSON)</option>
              <option value="pipedrive_sync_log">Pipedrive Sync Audit (JSON)</option>
            </select>

            <select
              aria-label="Export cadence"
              value={exportCadence}
              onChange={(e) =>
                setExportCadence(e.target.value as 'manual' | 'daily' | 'weekly')
              }
              className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-[#111827]"
            >
              <option value="manual">One-Time Export</option>
              <option value="daily">Daily Automated</option>
              <option value="weekly">Weekly Automated</option>
            </select>

            <button
              type="button"
              disabled={creatingReport}
              onClick={() => handleGenerateReport(exportType, exportCadence, true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#ff0031] px-4 text-xs font-semibold text-white hover:bg-[#D90029] disabled:opacity-60"
            >
              {creatingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Export &amp; Log Report</span>
            </button>
          </div>
        </div>

        {exportsHistory.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <CalendarClock className="h-4 w-4 text-[#ff0031]" />
              <span>Recent Export Schedule &amp; Audit Log</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {exportsHistory.slice(0, 6).map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-[#FAFAFB] px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#111827]">
                      {exp.reportName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {exp.cadence} · {exp.recordCount} records
                    </div>
                  </div>
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-base font-bold text-[#111827]">
              Real-Time Customer Orders ({filteredOrders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Updating a stage syncs immediately to the founder&apos;s public progress tracker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, MRD code..."
                className="min-h-[40px] w-full rounded-lg border border-slate-300 pl-9 pr-3 text-xs text-[#111827] focus:border-[#ff0031] focus:outline-none sm:w-56"
              />
            </div>

            <select
              aria-label="Filter by order status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-[#111827]"
            >
              <option value="ALL">All Stages</option>
              {ORDER_STEPS.map((s) => (
                <option key={s.status} value={s.status}>
                  {s.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No customer formation orders match the current filter. Quotes submitted through the
            calculator appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#FAFAFB] text-slate-500">
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Founder</th>
                  <th className="px-4 py-3 font-semibold">Package &amp; Activity</th>
                  <th className="px-4 py-3 text-right font-semibold">Total (AED)</th>
                  <th className="px-4 py-3 font-semibold">Stage Progress</th>
                  <th className="px-4 py-3 font-semibold">Pipedrive CRM</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-mono font-semibold text-[#111827] whitespace-nowrap">
                      {ord.trackingCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#111827]">{ord.fullName}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {ord.countryCode} {ord.whatsappNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#111827]">
                        {ord.packageName} · {ord.jurisdiction}
                      </div>
                      <div className="max-w-[210px] truncate text-[11px] text-slate-500">
                        {ord.businessActivity} ({ord.visaCount} visas)
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-[#111827] whitespace-nowrap">
                      {ord.estimatedTotalAed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        aria-label={`Update status for ${ord.trackingCode}`}
                        disabled={updatingId === ord.id}
                        value={ord.status}
                        onChange={(e) =>
                          handleStatusChange(ord, e.target.value as OrderWorkflowStatus)
                        }
                        className="min-h-[36px] rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-[#111827] focus:border-[#ff0031] focus:outline-none"
                      >
                        {ORDER_STEPS.map((s) => (
                          <option key={s.status} value={s.status}>
                            0{s.step}. {s.status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {ord.pipedriveSyncStatus === 'synced' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[#008A72]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Synced #{ord.pipedriveDealId}</span>
                        </span>
                      ) : ord.pipedriveSyncStatus === 'pending_config' ? (
                        <span className="font-medium text-[#D97706]">Staged (No Token)</span>
                      ) : ord.pipedriveSyncStatus === 'failed' ? (
                        <span className="font-medium text-[#ff0031]">Sync Failed</span>
                      ) : (
                        <span className="font-medium text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteOrder(ord);
                            setNoteDraft(ord.notes || '');
                          }}
                          className="rounded border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Notes
                        </button>
                        <button
                          type="button"
                          disabled={syncingOrderId === ord.id}
                          onClick={() => onSyncPipedrive(ord)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-[#111827] hover:border-[#00b294] hover:text-[#008A72] disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${syncingOrderId === ord.id ? 'animate-spin' : ''}`}
                          />
                          <span>CRM</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Notes Modal */}
      {editingNoteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
          <form
            onSubmit={handleSaveNotes}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h4 className="font-display text-base font-bold text-[#111827]">
              PRO Notes · {editingNoteOrder.trackingCode}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Internal compliance remarks for {editingNoteOrder.fullName}.
            </p>
            <textarea
              rows={4}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Passport verification status, trade name options, bank referral notes..."
              className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm text-[#111827] focus:border-[#ff0031] focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingNoteOrder(null)}
                className="min-h-[40px] rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-lg bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029]"
              >
                Save Notes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
