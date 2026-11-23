import { useEffect, useState } from 'react';
import { signOut, type User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileEdit,
  Link2,
  LogOut,
  Mail,
  Menu,
  Package,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  DEFAULT_BLOG_POSTS,
  DEFAULT_CMS_LANDING,
  DEFAULT_INVENTORY_SEED,
  DEFAULT_NAV_MENU_ITEMS,
} from '../data/defaults';
import { OperationType, auth, db, handleFirestoreError } from '../lib/firebase';
import type {
  BlogPost,
  CmsLandingConfig,
  ContactInquiry,
  FormationOrder,
  InventoryAlert,
  InventoryItem,
  NavMenuItem,
  ReportExport,
} from '../types/domain';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminCmsTab } from './AdminCmsTab';
import { AdminContactTab } from './AdminContactTab';
import { AdminInventoryTab } from './AdminInventoryTab';
import { AdminOrdersTab } from './AdminOrdersTab';

interface AdminDashboardProps {
  user: User;
  onViewSite: () => void;
}

type AdminTab = 'analytics' | 'orders' | 'contact' | 'inventory' | 'pipedrive' | 'cms';

export function AdminDashboard({ user, onViewSite }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [orders, setOrders] = useState<FormationOrder[]>([]);
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [navMenuItems, setNavMenuItems] = useState<NavMenuItem[]>([]);
  const [exportsHistory, setExportsHistory] = useState<ReportExport[]>([]);
  const [cms, setCms] = useState<Omit<CmsLandingConfig, 'updatedAt'>>(DEFAULT_CMS_LANDING);

  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [pipedriveStatus, setPipedriveStatus] = useState<{
    configured: boolean;
    domain: string;
    endpoint: string;
  } | null>(null);

  // Bootstrap initial Firestore seed records if empty on first admin session
  useEffect(() => {
    async function ensureSeedData() {
      try {
        const [invSnap, cmsSnap, blogSnap, navSnap] = await Promise.all([
          getDocs(query(collection(db, 'inventory'), limit(1))),
          getDocs(query(collection(db, 'cmsLanding'), limit(1))),
          getDocs(query(collection(db, 'blogPosts'), limit(1))),
          getDocs(query(collection(db, 'navMenuItems'), limit(1))),
        ]);

        const batch = writeBatch(db);
        let hasWrites = false;

        if (cmsSnap.empty) {
          batch.set(doc(db, 'cmsLanding', 'main'), {
            ...DEFAULT_CMS_LANDING,
            updatedAt: serverTimestamp(),
          });
          hasWrites = true;
        } else {
          const existingCms = cmsSnap.docs[0].data() as CmsLandingConfig;
          const isLegacyName = !existingCms.siteName || existingCms.siteName === 'Meridian Setup';
          const needsZero = [12500, 11500].includes(existingCms.zeroVisaPriceAed);
          const needsOne = [18900, 17900].includes(existingCms.oneVisaPriceAed);
          const needsMainland = [24500, 23500].includes(existingCms.mainlandPriceAed);
          const needsPromo =
            existingCms.promoNotice?.startsWith('Q4 Allocation Open') ||
            existingCms.promoNotice?.startsWith('Special Offer · AED 1,000 Off');

          if (isLegacyName || needsZero || needsOne || needsMainland || needsPromo) {
            batch.update(doc(db, 'cmsLanding', 'main'), {
              ...(isLegacyName
                ? {
                    siteName: DEFAULT_CMS_LANDING.siteName,
                    phoneDisplay: DEFAULT_CMS_LANDING.phoneDisplay,
                  }
                : {}),
              ...(needsZero ? { zeroVisaPriceAed: DEFAULT_CMS_LANDING.zeroVisaPriceAed } : {}),
              ...(needsOne ? { oneVisaPriceAed: DEFAULT_CMS_LANDING.oneVisaPriceAed } : {}),
              ...(needsMainland ? { mainlandPriceAed: DEFAULT_CMS_LANDING.mainlandPriceAed } : {}),
              ...(needsPromo ? { promoNotice: DEFAULT_CMS_LANDING.promoNotice } : {}),
              updatedAt: serverTimestamp(),
            });
            hasWrites = true;
          }
        }

        if (invSnap.empty) {
          for (const item of DEFAULT_INVENTORY_SEED) {
            batch.set(doc(db, 'inventory', item.id), {
              ...item,
              updatedAt: serverTimestamp(),
            });
          }
          hasWrites = true;
        } else {
          const allInv = await getDocs(collection(db, 'inventory'));
          const legacyPriceMap: Record<string, { oldPrices: number[]; newPrice: number; newName?: string }> = {
            inv_meydan_zero: {
              oldPrices: [12500, 11500],
              newPrice: 5000,
              newName: 'All UAE Free Zones Zero-Visa Quota',
            },
            inv_ifza_one_visa: {
              oldPrices: [18900, 17900],
              newPrice: 10900,
              newName: 'All UAE Free Zones 1-Visa Allocation',
            },
            inv_ded_mainland: {
              oldPrices: [24500, 23500],
              newPrice: 12900,
            },
            inv_wio_bank_fasttrack: {
              oldPrices: [1500],
              newPrice: 500,
            },
            inv_vip_emirates_medical: {
              oldPrices: [950],
              newPrice: 650,
            },
          };
          allInv.docs.forEach((d) => {
            const invData = d.data() as InventoryItem;
            const rule = legacyPriceMap[d.id];
            if (rule && rule.oldPrices.includes(invData.unitCostAed)) {
              batch.update(doc(db, 'inventory', d.id), {
                unitCostAed: rule.newPrice,
                ...(rule.newName ? { name: rule.newName } : {}),
                updatedAt: serverTimestamp(),
              });
              hasWrites = true;
            }
          });
        }

        if (blogSnap.empty) {
          DEFAULT_BLOG_POSTS.forEach((post, i) => {
            batch.set(doc(db, 'blogPosts', `guide_seed_${i + 1}`), {
              ...post,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          });
          hasWrites = true;
        }

        if (navSnap.empty) {
          for (const navItem of DEFAULT_NAV_MENU_ITEMS) {
            batch.set(doc(db, 'navMenuItems', navItem.id), {
              ...navItem,
              updatedAt: serverTimestamp(),
            });
          }
          hasWrites = true;
        }

        if (hasWrites) {
          await batch.commit();
        }
      } catch (err) {
        console.error('Seed initialization warning:', err);
      }
    }

    ensureSeedData();
  }, []);

  // Fetch server-side Pipedrive CRM configuration status
  useEffect(() => {
    fetch('/api/pipedrive/status')
      .then((res) => res.json())
      .then((data) => setPipedriveStatus(data))
      .catch(() => setPipedriveStatus(null));
  }, []);

  // Real-time Firestore listeners
  useEffect(() => {
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => {
        setOrders(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<FormationOrder, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubInventory = onSnapshot(
      collection(db, 'inventory'),
      (snap) => {
        setInventory(snap.docs.map((d) => d.data() as InventoryItem));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inventory')
    );

    const unsubAlerts = onSnapshot(
      query(collection(db, 'alerts'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAlerts(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<InventoryAlert, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'alerts')
    );

    const unsubCms = onSnapshot(
      doc(db, 'cmsLanding', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CmsLandingConfig;
          const isLegacy = !data.siteName || data.siteName === 'Meridian Setup';
          setCms({
            heroHeadline: data.heroHeadline,
            heroSubheadline: data.heroSubheadline,
            whatsappNumber: data.whatsappNumber,
            phoneDisplay: data.phoneDisplay || DEFAULT_CMS_LANDING.phoneDisplay,
            googleRatingScore: data.googleRatingScore,
            googleReviewCount: data.googleReviewCount,
            zeroVisaPriceAed: data.zeroVisaPriceAed,
            oneVisaPriceAed: data.oneVisaPriceAed,
            mainlandPriceAed: data.mainlandPriceAed,
            promoNotice: data.promoNotice,
            siteName: isLegacy ? DEFAULT_CMS_LANDING.siteName : data.siteName,
            logoDataUrl: data.logoDataUrl || DEFAULT_CMS_LANDING.logoDataUrl,
            footerLogoDataUrl: data.footerLogoDataUrl || DEFAULT_CMS_LANDING.footerLogoDataUrl,
            faviconDataUrl: data.faviconDataUrl || DEFAULT_CMS_LANDING.faviconDataUrl,
            socialLinkedin: data.socialLinkedin || '',
            socialInstagram: data.socialInstagram || '',
            socialX: data.socialX || '',
            socialYoutube: data.socialYoutube || '',
            socialFacebook: data.socialFacebook || '',
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'cmsLanding/main')
    );

    const unsubNavMenu = onSnapshot(
      collection(db, 'navMenuItems'),
      (snap) => {
        const loaded = snap.docs
          .map((d) => d.data() as NavMenuItem)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setNavMenuItems(loaded);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'navMenuItems')
    );

    const unsubBlogs = onSnapshot(
      query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc')),
      (snap) => {
        setBlogPosts(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<BlogPost, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blogPosts')
    );

    const unsubExports = onSnapshot(
      query(collection(db, 'reportExports'), orderBy('createdAt', 'desc')),
      (snap) => {
        setExportsHistory(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReportExport, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reportExports')
    );

    const unsubContacts = onSnapshot(
      query(collection(db, 'contactInquiries'), orderBy('createdAt', 'desc')),
      (snap) => {
        setContactInquiries(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ContactInquiry, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'contactInquiries')
    );

    return () => {
      unsubOrders();
      unsubInventory();
      unsubAlerts();
      unsubCms();
      unsubNavMenu();
      unsubBlogs();
      unsubExports();
      unsubContacts();
    };
  }, []);

  async function handleSyncOrderToPipedrive(order: FormationOrder) {
    setSyncingOrderId(order.id);
    try {
      const res = await fetch('/api/pipedrive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode: order.trackingCode,
          fullName: order.fullName,
          countryCode: order.countryCode,
          whatsappNumber: order.whatsappNumber,
          email: order.email,
          jurisdiction: order.jurisdiction,
          authority: order.authority,
          businessActivity: order.businessActivity,
          visaCount: order.visaCount,
          packageName: order.packageName,
          estimatedTotalAed: order.estimatedTotalAed,
          source: order.source || 'Admin Manual Sync',
        }),
      });
      const json = (await res.json()) as {
        syncStatus: 'synced' | 'pending_config' | 'failed';
        pipedriveDealId?: string;
        pipedrivePersonId?: string;
        error?: string;
      };

      await updateDoc(doc(db, 'orders', order.id), {
        pipedriveSyncStatus: json.syncStatus,
        ...(json.pipedriveDealId ? { pipedriveDealId: json.pipedriveDealId } : {}),
        ...(json.pipedrivePersonId ? { pipedrivePersonId: json.pipedrivePersonId } : {}),
        ...(json.error ? { pipedriveError: json.error } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setSyncingOrderId(null);
    }
  }

  async function handleBatchSyncPending() {
    setBatchSyncing(true);
    const pending = orders.filter((o) => o.pipedriveSyncStatus !== 'synced');
    for (const ord of pending) {
      await handleSyncOrderToPipedrive(ord);
    }
    setBatchSyncing(false);
  }

  const lowInventoryItems = inventory.filter(
    (item) => item.alertEnabled && item.stockLevel <= item.lowThreshold
  );

  const newContactCount = contactInquiries.filter((c) => c.status === 'New').length;

  const navItems: { id: AdminTab; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { id: 'analytics', label: 'Overview & Analytics', icon: BarChart3 },
    { id: 'orders', label: 'Orders & Exports', icon: ClipboardList, badge: orders.length },
    {
      id: 'contact',
      label: 'Contact Inquiries',
      icon: Mail,
      badge: newContactCount > 0 ? newContactCount : contactInquiries.length || undefined,
    },
    {
      id: 'inventory',
      label: 'Inventory & Alerts',
      icon: Package,
      badge: lowInventoryItems.length > 0 ? lowInventoryItems.length : undefined,
    },
    { id: 'pipedrive', label: 'Pipedrive CRM', icon: Link2 },
    { id: 'cms', label: 'CMS & Blog', icon: FileEdit },
  ];

  const tabTitles: Record<AdminTab, string> = {
    analytics: 'Overview & Customer Analytics',
    orders: 'Real-Time Orders & Management Exports',
    contact: 'Contact Us Inbox & Proposal Email Templates',
    inventory: 'Inventory Pools & Customizable Alerts',
    pipedrive: 'Pipedrive CRM Lead Sync',
    cms: 'Landing Page & Blog CMS',
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFB] text-[#111827]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white lg:flex">
        <div>
          <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
            <img
              src="/assets/aistudio/Logo-icon_e4a5711a.png"
              alt="Venture Zone"
              className="h-6 w-6 rounded object-contain contrast-[1.06] saturate-[1.15]"
            />
            <span className="truncate font-display text-sm font-extrabold tracking-tight text-[#111827]">
              venturezoneuae
            </span>
          </div>

          <nav className="space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3.5 text-left text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#ff0031] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#111827]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`font-mono text-[11px] font-bold tabular-nums ${
                        active ? 'text-white/90' : 'text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="truncate text-xs font-semibold text-[#111827]">
            {user.displayName || 'Operations Admin'}
          </div>
          <div className="truncate font-mono text-[11px] text-slate-500">{user.email}</div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onViewSite}
              className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-[#111827] hover:border-[#00b294] hover:text-[#008A72]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live Site</span>
            </button>
            <button
              type="button"
              onClick={() => signOut(auth)}
              aria-label="Sign out"
              className="flex min-h-[36px] items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#ff0031]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#111827]/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col justify-between bg-white p-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-display text-base font-extrabold text-[#111827]">
                  venturezoneuae Admin
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex min-h-[46px] w-full items-center justify-between rounded-lg px-3.5 text-xs font-semibold ${
                        active ? 'bg-[#ff0031] text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== undefined && (
                        <span className="font-mono text-[11px] tabular-nums">{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="truncate text-xs font-semibold text-[#111827]">{user.email}</div>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={onViewSite}
                  className="min-h-[40px] flex-1 rounded-lg border border-slate-300 text-xs font-semibold text-[#111827]"
                >
                  Live Site
                </button>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-xs font-semibold text-[#ff0031]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-[#111827] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate font-display text-base font-bold text-[#111827] sm:text-lg">
              {tabTitles[activeTab]}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onViewSite}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-[#FAFAFB] px-3 text-xs font-semibold text-[#111827] hover:border-[#00b294] hover:text-[#008A72] whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Landing Page</span>
              <span className="sm:hidden">Site</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6">
          {/* Low Inventory Operational Alert Banner */}
          {lowInventoryItems.length > 0 && (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3.5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" />
                <div className="text-xs text-amber-950">
                  <span className="font-bold">
                    Low Inventory Alert ({lowInventoryItems.length}{' '}
                    {lowInventoryItems.length === 1 ? 'pool' : 'pools'} below threshold):
                  </span>{' '}
                  <span>
                    {lowInventoryItems
                      .map((i) => `${i.name} (${i.stockLevel} left)`)
                      .join(' · ')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="min-h-[36px] shrink-0 rounded-lg bg-[#111827] px-3.5 text-xs font-semibold text-white hover:bg-[#ff0031]"
              >
                Manage Inventory
              </button>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AdminAnalyticsTab orders={orders} inventory={inventory} />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              exportsHistory={exportsHistory}
              onSyncPipedrive={handleSyncOrderToPipedrive}
              syncingOrderId={syncingOrderId}
            />
          )}

          {activeTab === 'contact' && (
            <AdminContactTab inquiries={contactInquiries} />
          )}

          {activeTab === 'inventory' && (
            <AdminInventoryTab inventory={inventory} alerts={alerts} />
          )}

          {activeTab === 'pipedrive' && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-display text-base font-bold text-[#111827]">
                    Pipedrive CRM Server Connector
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Customer quotes automatically trigger{' '}
                    <span className="font-mono">/api/pipedrive/sync</span> to create a Pipedrive
                    Person, AED Deal, and activity note.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-600">
                      Server Secret Status:{' '}
                      {pipedriveStatus?.configured ? (
                        <span className="text-[#008A72]">Connected ({pipedriveStatus.endpoint})</span>
                      ) : (
                        <span className="text-[#D97706]">
                          Pending PIPEDRIVE_API_TOKEN in Environment Secrets
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={batchSyncing || orders.length === 0}
                  onClick={handleBatchSyncPending}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029] disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${batchSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync All Pending Leads</span>
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#FAFAFB] text-slate-500">
                        <th className="px-4 py-3 font-semibold">Tracking Ref</th>
                        <th className="px-4 py-3 font-semibold">Lead Contact</th>
                        <th className="px-4 py-3 text-right font-semibold">Deal Value</th>
                        <th className="px-4 py-3 font-semibold">Pipedrive Status</th>
                        <th className="px-4 py-3 font-semibold">Deal / Person ID</th>
                        <th className="px-4 py-3 text-right font-semibold">Sync Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            No leads queued yet. Submit a quote in the cost calculator to test CRM
                            sync.
                          </td>
                        </tr>
                      ) : (
                        orders.map((ord) => (
                          <tr key={ord.id}>
                            <td className="px-4 py-3.5 font-mono font-semibold text-[#111827]">
                              {ord.trackingCode}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-[#111827]">{ord.fullName}</div>
                              <div className="font-mono text-[11px] text-slate-500">
                                {ord.countryCode} {ord.whatsappNumber}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-[#111827]">
                              AED {ord.estimatedTotalAed.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5">
                              {ord.pipedriveSyncStatus === 'synced' ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-[#008A72]">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Synced</span>
                                </span>
                              ) : (
                                <span className="font-semibold text-[#D97706]">
                                  {ord.pipedriveSyncStatus}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                              {ord.pipedriveDealId
                                ? `Deal #${ord.pipedriveDealId} · Person #${ord.pipedrivePersonId || '-'}`
                                : ord.pipedriveError || 'Awaiting live sync'}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                disabled={syncingOrderId === ord.id}
                                onClick={() => handleSyncOrderToPipedrive(ord)}
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#111827] hover:border-[#00b294] hover:text-[#008A72] disabled:opacity-50"
                              >
                                {syncingOrderId === ord.id ? 'Syncing...' : 'Sync Now'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cms' && (
            <AdminCmsTab cms={cms} navMenuItems={navMenuItems} blogPosts={blogPosts} />
          )}
        </main>
      </div>
    </div>
  );
}
