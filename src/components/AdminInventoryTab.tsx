import { useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { AlertTriangle, Bell, Check, Minus, Plus } from 'lucide-react';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import type {
  AlertChannel,
  InventoryAlert,
  InventoryCategory,
  InventoryItem,
} from '../types/domain';

interface AdminInventoryTabProps {
  inventory: InventoryItem[];
  alerts: InventoryAlert[];
}

export function AdminInventoryTab({ inventory, alerts }: AdminInventoryTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryCategory>('License Quota');
  const [newStock, setNewStock] = useState(15);
  const [newCapacity, setNewCapacity] = useState(30);
  const [newThreshold, setNewThreshold] = useState(6);
  const [newChannel, setNewChannel] = useState<AlertChannel>('Dashboard Banner');
  const [newUnitCost, setNewUnitCost] = useState(12500);

  async function updateInventoryItem(
    item: InventoryItem,
    patch: Partial<
      Pick<
        InventoryItem,
        'stockLevel' | 'lowThreshold' | 'alertEnabled' | 'alertChannel'
      >
    >
  ) {
    const nextStock =
      patch.stockLevel !== undefined ? Math.max(0, patch.stockLevel) : item.stockLevel;
    const nextThreshold =
      patch.lowThreshold !== undefined ? Math.max(0, patch.lowThreshold) : item.lowThreshold;
    const nextAlertEnabled =
      patch.alertEnabled !== undefined ? patch.alertEnabled : item.alertEnabled;

    try {
      await updateDoc(doc(db, 'inventory', item.id), {
        ...patch,
        stockLevel: nextStock,
        lowThreshold: nextThreshold,
        updatedAt: serverTimestamp(),
      });

      if (nextAlertEnabled && nextStock <= nextThreshold) {
        await addDoc(collection(db, 'alerts'), {
          inventoryId: item.id,
          itemName: item.name,
          stockLevel: nextStock,
          threshold: nextThreshold,
          severity: nextStock <= Math.floor(nextThreshold / 2) ? 'critical' : 'warning',
          acknowledged: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inventory/${item.id}`);
    }
  }

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        acknowledged: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alerts/${alertId}`);
    }
  }

  async function handleCreateInventory(e: React.FormEvent) {
    e.preventDefault();
    const id = `inv_${Date.now()}`;
    try {
      await setDoc(doc(db, 'inventory', id), {
        id,
        name: newName.trim().slice(0, 120),
        category: newCategory,
        stockLevel: Number(newStock),
        maxCapacity: Math.max(1, Number(newCapacity)),
        lowThreshold: Number(newThreshold),
        alertEnabled: true,
        alertChannel: newChannel,
        unitCostAed: Number(newUnitCost),
        updatedAt: serverTimestamp(),
      });
      setShowAddModal(false);
      setNewName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `inventory/${id}`);
    }
  }

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-display text-base font-bold text-[#111827]">
            License Quotas, Visa Pools &amp; Customizable Threshold Alerts
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Configure minimum threshold alerts for each formation pool. Low inventory triggers
            real-time operational warnings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-lg bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Quota Pool</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#FAFAFB] text-slate-500">
                <th className="px-4 py-3 font-semibold">Allocation Pool</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Current Stock</th>
                <th className="px-4 py-3 font-semibold">Low Alert Threshold</th>
                <th className="px-4 py-3 font-semibold">Alert Channel</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Alerts Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const isLow = item.alertEnabled && item.stockLevel <= item.lowThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#111827]">{item.name}</div>
                      <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                        AED {item.unitCostAed.toLocaleString()} / unit
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{item.category}</td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Decrease stock for ${item.name}`}
                          onClick={() =>
                            updateInventoryItem(item, { stockLevel: item.stockLevel - 1 })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-16 text-center font-mono text-xs font-bold tabular-nums text-[#111827]">
                          {item.stockLevel} / {item.maxCapacity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase stock for ${item.name}`}
                          onClick={() =>
                            updateInventoryItem(item, { stockLevel: item.stockLevel + 1 })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <input
                        type="number"
                        min={0}
                        max={item.maxCapacity}
                        aria-label={`Low threshold for ${item.name}`}
                        value={item.lowThreshold}
                        onChange={(e) =>
                          updateInventoryItem(item, {
                            lowThreshold: Number(e.target.value),
                          })
                        }
                        className="h-9 w-20 rounded-md border border-slate-300 px-2.5 font-mono text-xs font-semibold tabular-nums text-[#111827]"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        aria-label={`Alert channel for ${item.name}`}
                        value={item.alertChannel || 'Dashboard Banner'}
                        onChange={(e) =>
                          updateInventoryItem(item, {
                            alertChannel: e.target.value as AlertChannel,
                          })
                        }
                        className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-[#111827]"
                      >
                        <option value="Dashboard Banner">Dashboard Banner</option>
                        <option value="Ops Slack Channel">Ops Slack Channel</option>
                        <option value="Daily Digest">Daily Digest</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#ff0031]">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#008A72]">
                          <Check className="h-3.5 w-3.5" />
                          <span>Healthy</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          updateInventoryItem(item, { alertEnabled: !item.alertEnabled })
                        }
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          item.alertEnabled
                            ? 'bg-[#00b294] text-white'
                            : 'border border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        {item.alertEnabled ? 'Enabled' : 'Paused'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert History Log */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#D97706]" />
            <h4 className="font-display text-sm font-bold text-[#111827]">
              Triggered Low-Inventory Alerts ({unacknowledgedAlerts.length} unacknowledged)
            </h4>
          </div>
        </div>

        {alerts.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">
            No low-inventory alerts triggered yet. Alerts fire automatically when stock drops to or
            below your configured threshold.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {alerts.slice(0, 8).map((al) => (
              <div
                key={al.id}
                className={`flex flex-col justify-between gap-2 rounded-lg border px-4 py-3 text-xs sm:flex-row sm:items-center ${
                  al.acknowledged
                    ? 'border-slate-200 bg-[#FAFAFB] text-slate-500'
                    : 'border-amber-200 bg-amber-50 text-amber-950'
                }`}
              >
                <div>
                  <span className="font-bold">{al.itemName}</span>
                  <span className="mx-2">·</span>
                  <span className="font-mono tabular-nums">
                    Stock {al.stockLevel} (Threshold {al.threshold})
                  </span>
                  <span className="mx-2">·</span>
                  <span className="uppercase font-semibold">{al.severity}</span>
                </div>
                {al.acknowledged ? (
                  <span className="font-semibold text-slate-400">Acknowledged</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAcknowledgeAlert(al.id)}
                    className="rounded-md bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#ff0031]"
                  >
                    Acknowledge Alert
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Quota Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
          <form
            onSubmit={handleCreateInventory}
            className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h4 className="font-display text-base font-bold text-[#111827]">
              Add Formation Quota Pool
            </h4>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Pool Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. RAKEZ E-Commerce License Quota"
                className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as InventoryCategory)}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
                >
                  <option value="License Quota">License Quota</option>
                  <option value="Visa Allocation">Visa Allocation</option>
                  <option value="Banking Slot">Banking Slot</option>
                  <option value="VIP Medical">VIP Medical</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Alert Channel
                </label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as AlertChannel)}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
                >
                  <option value="Dashboard Banner">Dashboard Banner</option>
                  <option value="Ops Slack Channel">Ops Slack Channel</option>
                  <option value="Daily Digest">Daily Digest</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Stock</label>
                <input
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Threshold</label>
                <input
                  type="number"
                  min={0}
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Number(e.target.value))}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Unit Value (AED)
              </label>
              <input
                type="number"
                min={0}
                value={newUnitCost}
                onChange={(e) => setNewUnitCost(Number(e.target.value))}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="min-h-[40px] rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-lg bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029]"
              >
                Create Pool
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
