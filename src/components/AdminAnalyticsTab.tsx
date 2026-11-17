import { ORDER_STEPS } from '../data/defaults';
import type { FormationOrder, InventoryItem } from '../types/domain';

interface AdminAnalyticsTabProps {
  orders: FormationOrder[];
  inventory: InventoryItem[];
}

export function AdminAnalyticsTab({ orders, inventory }: AdminAnalyticsTabProps) {
  const totalOrders = orders.length;
  const totalPipelineAed = orders.reduce((acc, o) => acc + (o.estimatedTotalAed || 0), 0);
  const avgTicketAed = totalOrders > 0 ? Math.round(totalPipelineAed / totalOrders) : 0;
  const syncedCount = orders.filter((o) => o.pipedriveSyncStatus === 'synced').length;
  const syncRate = totalOrders > 0 ? Math.round((syncedCount / totalOrders) * 100) : 0;
  const completedCount = orders.filter((o) => o.status === 'Completed' || o.currentStep >= 4).length;

  const freeZoneOrders = orders.filter((o) => o.jurisdiction === 'Free Zone');
  const mainlandOrders = orders.filter((o) => o.jurisdiction === 'Mainland');
  const freeZoneRev = freeZoneOrders.reduce((sum, o) => sum + (o.estimatedTotalAed || 0), 0);
  const mainlandRev = mainlandOrders.reduce((sum, o) => sum + (o.estimatedTotalAed || 0), 0);
  const maxRev = Math.max(freeZoneRev, mainlandRev, 1);

  // Country code breakdown
  const countryMap = new Map<string, { count: number; valueAed: number }>();
  for (const ord of orders) {
    const code = ord.countryCode || '+971';
    const existing = countryMap.get(code) || { count: 0, valueAed: 0 };
    countryMap.set(code, {
      count: existing.count + 1,
      valueAed: existing.valueAed + (ord.estimatedTotalAed || 0),
    });
  }
  const countryRows = Array.from(countryMap.entries()).sort((a, b) => b[1].count - a[1].count);

  const lowStockCount = inventory.filter(
    (item) => item.alertEnabled && item.stockLevel <= item.lowThreshold
  ).length;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total Pipeline Value</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#111827]">
            AED {totalPipelineAed.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Avg. AED {avgTicketAed.toLocaleString()} per quote
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Customer Orders &amp; Leads</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#111827]">
            {totalOrders}
          </div>
          <div className="mt-1 text-xs font-medium text-[#008A72] tabular-nums">
            {completedCount} license-stage or completed
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Pipedrive CRM Sync</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#111827]">
            {syncRate}%
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {syncedCount} of {totalOrders} leads synced to CRM
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Low Inventory Alerts</div>
          <div
            className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
              lowStockCount > 0 ? 'text-[#ff0031]' : 'text-[#008A72]'
            }`}
          >
            {lowStockCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Across {inventory.length} active quota pools
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Jurisdiction Revenue Split */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h3 className="font-display text-base font-bold text-[#111827]">
            Revenue by Jurisdiction
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Real-time AED comparison between Free Zone and Dubai Mainland formations.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111827]">
                  Dubai Free Zone ({freeZoneOrders.length})
                </span>
                <span className="font-mono font-bold tabular-nums text-[#ff0031]">
                  AED {freeZoneRev.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#ff0031] transition-all"
                  style={{ width: `${Math.round((freeZoneRev / maxRev) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111827]">
                  Dubai Mainland LLC ({mainlandOrders.length})
                </span>
                <span className="font-mono font-bold tabular-nums text-[#111827]">
                  AED {mainlandRev.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#111827] transition-all"
                  style={{ width: `${Math.round((mainlandRev / maxRev) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <h4 className="text-xs font-semibold text-slate-600">
              Founder Traffic by Country Code
            </h4>
            {countryRows.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">
                Country breakdown populates automatically as quotes arrive.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {countryRows.slice(0, 5).map(([code, stat]) => (
                  <div
                    key={code}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-semibold text-[#111827]">{code}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {stat.count} leads · AED {stat.valueAed.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 6-Stage Formation Pipeline Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h3 className="font-display text-base font-bold text-[#111827]">
            Formation Pipeline Funnel
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Live order distribution across registration milestones.
          </p>

          <div className="mt-5 space-y-3.5">
            {ORDER_STEPS.map((st) => {
              const count = orders.filter((o) => o.status === st.status).length;
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={st.step} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#111827]">
                      0{st.step}. {st.status}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-slate-600">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#00b294] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
