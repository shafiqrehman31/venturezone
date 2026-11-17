import { useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileDown,
  Globe2,
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  COUNTRY_CODES,
  DMCC_BOOKLET_CATEGORIES,
  detectDefaultCountryCode,
} from '../data/defaults';
import { downloadProposalBooklet } from '../lib/downloadBooklet';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import type {
  BlogPost,
  CmsLandingConfig,
  JurisdictionType,
  NavMenuItem,
} from '../types/domain';
import bankingSuiteImg from '../assets/images/dubai_banking_suite_1794581931541.jpg';
import difcArchImg from '../assets/images/difc_spatial_arch_1794581930099.jpg';

interface SubpageProps {
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  menuItem?: NavMenuItem;
  onStartQuote: (jurisdiction: JurisdictionType, visaCount: number) => void;
}

const FREE_ZONES = [
  {
    id: 'meydan',
    name: 'Meydan Free Zone',
    focus: 'Consultancy, Tech, E-Commerce & Holding',
    priceAed: 11500,
    standardPriceAed: 12500,
    speed: '48 Hours',
    remote: '100% Remote',
    visaCap: 'Up to 6 Visas (Flexi-Desk)',
    highlights: [
      '0% Personal & Qualifying Corporate Tax',
      'Prime Dubai Nad Al Sheba business registration',
      'Mix up to 3 commercial & consultancy activities',
    ],
  },
  {
    id: 'ifza',
    name: 'IFZA Dubai',
    focus: 'SaaS, Digital Agencies & General Trading',
    priceAed: 13900,
    standardPriceAed: 14900,
    speed: '3 Business Days',
    remote: '100% Remote',
    visaCap: 'Up to 6 Visas',
    highlights: [
      'Flexible multi-year license discounts',
      'Seamless Wio & Mashreq digital bank onboarding',
      'No physical office lease required',
    ],
  },
  {
    id: 'rakez',
    name: 'RAKEZ Economic Zone',
    focus: 'E-Commerce, Industrial, Freelance & SME',
    priceAed: 10800,
    standardPriceAed: 11800,
    speed: '2–3 Business Days',
    remote: '100% Remote',
    visaCap: 'Up to 5 Visas (Co-Working)',
    highlights: [
      'Lowest annual renewal rate in the UAE',
      'Dedicated warehouse & industrial options',
      'Fast establishment card issuance',
    ],
  },
  {
    id: 'dmcc',
    name: 'DMCC (JLT Dubai)',
    focus: 'Commodities, Crypto, Fintech & Enterprise',
    priceAed: 28500,
    standardPriceAed: 29500,
    speed: '7–10 Business Days',
    remote: 'Remote + Portal KYC',
    visaCap: 'Scalable Office Visas',
    highlights: [
      'Ranked #1 Global Free Zone for institutional prestige',
      'Tier-1 corporate banking acceptance globally',
      'JLT & Uptown Dubai business centre hubs',
    ],
  },
];

export function FreeZonesPage({ menuItem, onStartQuote }: SubpageProps) {
  const [filterType, setFilterType] = useState<'all' | 'dubai' | 'budget'>('all');
  const [downloadingBooklet, setDownloadingBooklet] = useState(false);

  async function handleBookletDownload() {
    if (downloadingBooklet) return;
    setDownloadingBooklet(true);
    try {
      await downloadProposalBooklet();
    } finally {
      setDownloadingBooklet(false);
    }
  }

  const visibleZones = FREE_ZONES.filter((z) => {
    if (filterType === 'dubai') return z.id !== 'rakez';
    if (filterType === 'budget') return z.priceAed <= 14000;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      {/* Spatial Header Banner */}
      <div className="spatial-glass grid grid-cols-1 items-stretch gap-8 overflow-hidden rounded-3xl p-7 sm:p-10 lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="text-xs font-semibold tracking-wide text-[#ff0031]">
            UAE Free Zone Jurisdictions
          </p>
          <h1
            className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            {menuItem?.pageTitle || '100% Foreign-Owned Dubai Free Zone Companies'}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {menuItem?.pageSubtitle ||
              'Incorporate remotely within 48 hours without renting a physical office. Compare licensed UAE Free Zones side-by-side and launch directly into our cost calculator.'}
          </p>
          {menuItem?.pageBody && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{menuItem.pageBody}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onStartQuote('Free Zone', 1)}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#ff0031] px-5 text-sm font-bold text-white transition-colors hover:bg-[#D90029]"
            >
              <span>{menuItem?.ctaLabel || 'Calculate Free Zone Setup'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={downloadingBooklet}
              onClick={handleBookletDownload}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 bg-white/85 px-5 text-sm font-bold text-[#111827] transition-colors hover:border-[#00b294] hover:bg-white disabled:opacity-60"
            >
              {downloadingBooklet ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#00b294]" />
              ) : (
                <FileDown className="h-4 w-4 text-[#00b294]" />
              )}
              <span>{downloadingBooklet ? 'Preparing PDF...' : 'Download Booklet (PDF)'}</span>
            </button>
          </div>
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-slate-100 lg:col-span-5">
          <img
            src={difcArchImg}
            alt="Dubai geometric limestone arches and reflective glass atrium"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Interactive Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-[#111827]">
          Compare Approved Free Zones
        </h2>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/80 p-1 backdrop-blur">
          {[
            { id: 'all', label: 'All Jurisdictions' },
            { id: 'dubai', label: 'Dubai Emirate' },
            { id: 'budget', label: 'Under AED 14,000' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as 'all' | 'dubai' | 'budget')}
              className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-[#ff0031] text-white'
                  : 'text-slate-600 hover:text-[#111827]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Free Zone Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {visibleZones.map((zone) => (
          <div
            key={zone.id}
            className="spatial-glass flex flex-col justify-between rounded-2xl p-6 sm:p-7"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-[#008A72]">
                  <Globe2 className="h-4 w-4" />
                  <span>{zone.remote}</span>
                </span>
                <span className="font-mono font-semibold tabular-nums">{zone.speed}</span>
              </div>

              <h3 className="mt-2 font-display text-xl font-bold text-[#111827]">{zone.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{zone.focus}</p>

              <div className="mt-4 flex items-baseline justify-between border-y border-slate-200/70 py-3.5">
                <span className="text-xs font-medium text-slate-500">
                  Offer Price (- AED 1,000)
                </span>
                <div className="text-right">
                  <span className="mr-2 font-mono text-xs text-slate-400 line-through">
                    AED {zone.standardPriceAed.toLocaleString()}
                  </span>
                  <span className="font-mono text-2xl font-bold tabular-nums text-[#ff0031]">
                    AED {zone.priceAed.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs font-semibold text-slate-600">
                Allocation: <span className="text-[#111827]">{zone.visaCap}</span>
              </div>

              <ul className="mt-4 space-y-2">
                {zone.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-[#1E293B]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b294]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onStartQuote('Free Zone', zone.id === 'rakez' ? 0 : 1)}
              className="mt-6 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#111827] bg-white/80 text-xs font-bold text-[#111827] transition-colors hover:border-[#ff0031] hover:bg-[#ff0031] hover:text-white"
            >
              <span>Calculate {zone.name} Quote</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* DMCC Business Centres, Offices, Permits & Visas Booklet Schedule (- AED 1,000) */}
      <div className="spatial-glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#111827]">
              DMCC Workspaces, Offices, Permits &amp; Visa Schedule
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              All categories reflect venturezoneuae.com&apos;s AED 1,000 reduction vs. standard schedules.
            </p>
          </div>
          <button
            type="button"
            disabled={downloadingBooklet}
            onClick={handleBookletDownload}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#00b294] px-4 text-xs font-bold text-white transition-colors hover:bg-[#00967C] disabled:opacity-60"
          >
            {downloadingBooklet ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <FileDown className="h-4 w-4 text-white" />
            )}
            <span>
              {downloadingBooklet ? 'Preparing PDF...' : 'Download Full Booklet (PDF)'}
            </span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {DMCC_BOOKLET_CATEGORIES.map((category) => (
            <div
              key={category.group}
              className="rounded-2xl border border-slate-200/80 bg-white/85 p-5"
            >
              <h3 className="font-display text-sm font-bold text-[#111827]">
                {category.group}
              </h3>
              <div className="mt-4 divide-y divide-slate-100">
                {category.items.map((item) => (
                  <div key={item.name} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-[#111827]">{item.name}</span>
                      <span className="font-mono text-sm font-bold tabular-nums text-[#ff0031]">
                        AED {item.offerAed.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.detail}</span>
                      <span className="font-mono line-through">
                        AED {item.standardAed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MainlandPage({ cms, menuItem, onStartQuote }: SubpageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div className="spatial-glass grid grid-cols-1 items-stretch gap-8 overflow-hidden rounded-3xl p-7 sm:p-10 lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="text-xs font-semibold tracking-wide text-[#ff0031]">
            Dubai Economy &amp; Tourism (DET)
          </p>
          <h1
            className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            {menuItem?.pageTitle || 'Dubai Mainland LLC Formation With 100% Ownership'}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {menuItem?.pageSubtitle ||
              'Trade directly across the entire UAE local market, open retail storefronts, and bid on government tenders with full foreign shareholding and scalable visa quotas.'}
          </p>
          {menuItem?.pageBody && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{menuItem.pageBody}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onStartQuote('Mainland', 1)}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#ff0031] px-5 text-sm font-bold text-white transition-colors hover:bg-[#D90029]"
            >
              <span>
                {menuItem?.ctaLabel || 'Quote Mainland LLC'} (AED{' '}
                {cms.mainlandPriceAed.toLocaleString()})
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-slate-100 lg:col-span-5">
          <img
            src={bankingSuiteImg}
            alt="Dubai Mainland executive glass boardroom overlooking the city skyline"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Comparison Matrix */}
      <div className="spatial-glass overflow-hidden rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold text-[#111827]">
          Mainland LLC vs. Free Zone Decision Matrix
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Key regulatory differences so you choose the structure aligned with your revenue model.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3 pr-4 font-semibold">Criteria</th>
                <th className="px-4 py-3 font-semibold text-[#111827]">Dubai Mainland LLC</th>
                <th className="pl-4 py-3 font-semibold text-[#111827]">Dubai Free Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {[
                ['Foreign Ownership', '100% (for 1,000+ commercial/service activities)', '100% across all activities'],
                ['UAE Local Trading', 'Unrestricted B2B, B2C, retail & gov tenders', 'B2B / international; local B2C via distributor'],
                ['Physical Office / Ejari', 'Virtual Ejari or physical office lease', 'No office required (Flexi-desk included)'],
                ['Corporate Tax', '0% up to AED 375,000 net profit; 9% above', '0% on Qualifying Income; 9% non-qualifying'],
                ['Visa Scalability', 'Unlimited (tied to workspace sq. ft.)', '1 to 6 visas on flexi-desk; more with office'],
              ].map(([crit, ml, fz]) => (
                <tr key={crit}>
                  <td className="py-3.5 pr-4 font-semibold text-[#111827]">{crit}</td>
                  <td className="px-4 py-3.5 text-slate-700">{ml}</td>
                  <td className="pl-4 py-3.5 text-slate-700">{fz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function BankingPage({ menuItem, onStartQuote }: SubpageProps) {
  const [checkedDocs, setCheckedDocs] = useState<string[]>([
    'Valid Passport (6+ months)',
    'UAE Trade License & MOA',
  ]);

  const kycChecklist = [
    'Valid Passport (6+ months)',
    'UAE Trade License & MOA',
    'Emirates ID & Residence Visa',
    '6 Months Personal Bank Statements',
    '1-Page Business Plan & Client Regions',
  ];

  function toggleDoc(item: string) {
    setCheckedDocs((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div className="spatial-glass grid grid-cols-1 items-stretch gap-8 overflow-hidden rounded-3xl p-7 sm:p-10 lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="text-xs font-semibold tracking-wide text-[#008A72]">
            Corporate Banking &amp; Residency
          </p>
          <h1
            className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            {menuItem?.pageTitle || 'UAE Business Bank Accounts & 2-Year Investor Visas'}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {menuItem?.pageSubtitle ||
              'Compliance pre-screening for international founders with direct onboarding introductions to Wio Business, Mashreq NeoBiz, and traditional UAE banks.'}
          </p>
          {menuItem?.pageBody && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{menuItem.pageBody}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onStartQuote('Free Zone', 1)}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#ff0031] px-5 text-sm font-bold text-white transition-colors hover:bg-[#D90029]"
            >
              <span>{menuItem?.ctaLabel || 'Quote 1-Visa + Banking Package'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-slate-100 lg:col-span-5">
          <img
            src={bankingSuiteImg}
            alt="Dubai corporate banking advisory suite"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Bank Partner Matrix + Interactive KYC Readiness Checklist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <h2 className="font-display text-2xl font-bold text-[#111827]">
            UAE Corporate Banking Partners
          </h2>
          {[
            {
              bank: 'Wio Business',
              timeline: '3–5 Business Days',
              minBalance: 'AED 0 (Monthly Plan)',
              desc: 'Multi-currency AED/USD/EUR/GBP IBAN, instant virtual cards, ideal for SaaS, agencies, and e-commerce.',
            },
            {
              bank: 'Mashreq NeoBiz',
              timeline: '5–7 Business Days',
              minBalance: 'AED 25,000–50,000',
              desc: 'Established UAE tier-1 digital banking with dedicated SME trade finance and global wire transfers.',
            },
            {
              bank: 'RAKBANK / Emirates NBD',
              timeline: '2–3 Weeks',
              minBalance: 'AED 50,000+',
              desc: 'Full-service relationship banking for Mainland LLCs, general trading, and high-volume treasury operations.',
            },
          ].map((b) => (
            <div key={b.bank} className="spatial-glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Landmark className="h-5 w-5 text-[#ff0031]" />
                  <h3 className="font-display text-lg font-bold text-[#111827]">{b.bank}</h3>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-[#008A72]">
                  {b.timeline} · {b.minBalance}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="spatial-glass flex flex-col justify-between rounded-2xl p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#111827]">
                KYC Readiness Checklist
              </h2>
              <span className="font-mono text-xs font-bold tabular-nums text-[#008A72]">
                {checkedDocs.length} / {kycChecklist.length} Ready
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tick off documents you already have prepared for first-pass compliance approval.
            </p>

            <div className="mt-5 space-y-2.5">
              {kycChecklist.map((docItem) => {
                const checked = checkedDocs.includes(docItem);
                return (
                  <button
                    key={docItem}
                    type="button"
                    onClick={() => toggleDoc(docItem)}
                    className={`flex min-h-[46px] w-full items-center gap-3 rounded-xl border px-3.5 text-left text-sm transition-colors ${
                      checked
                        ? 'border-[#00b294]/40 bg-[#00b294]/[0.08] font-semibold text-[#111827]'
                        : 'border-slate-200 bg-white/70 text-slate-600'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? 'border-[#00b294] bg-[#00b294] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span>{docItem}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200/80 bg-white/70 p-4 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-[#111827]">
              <Clock className="h-4 w-4 text-[#ff0031]" />
              <span>3-Day Emirates ID Biometrics Trip</span>
            </div>
            <p className="mt-1">
              Once your digital license is issued in 48 hours, you only visit Dubai for 3 business
              days for VIP medical screening and Emirates ID fingerprinting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GuidesContactPageProps {
  menuItem?: NavMenuItem;
  blogPosts: BlogPost[];
  onOpenArticle: (post: BlogPost) => void;
  onQuoteCreated: (trackingCode: string) => void;
}

export function GuidesContactPage({
  menuItem,
  blogPosts,
  onOpenArticle,
  onQuoteCreated,
}: GuidesContactPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState(() => detectDefaultCountryCode());
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionType>('Free Zone');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredPosts = blogPosts.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q)
    );
  });

  async function handleConsultationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    const cleanedPhone = phone.replace(/[^\d]/g, '');
    if (name.trim().length < 2 || cleanedPhone.length < 6) {
      setErrorMsg('Please enter your name and valid WhatsApp phone number.');
      return;
    }

    setSubmitting(true);
    const trackingCode = `MRD-${Math.floor(1000 + Math.random() * 9000)}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const estimatedTotalAed = jurisdiction === 'Mainland' ? 23500 : 17900;

    let pipedriveSyncStatus: 'pending' | 'synced' | 'pending_config' | 'failed' = 'pending';
    let pipedriveDealId: string | undefined;
    let pipedrivePersonId: string | undefined;

    try {
      const res = await fetch('/api/pipedrive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode,
          fullName: name.trim(),
          countryCode,
          whatsappNumber: cleanedPhone,
          email: email.trim() || undefined,
          jurisdiction,
          authority:
            jurisdiction === 'Mainland'
              ? 'Dubai Economy & Tourism (DET)'
              : 'Meydan / IFZA Free Zone',
          businessActivity: 'Advisory Consultation Inquiry',
          visaCount: 1,
          packageName: jurisdiction === 'Mainland' ? 'Mainland LLC' : '1-Visa All-Inclusive',
          estimatedTotalAed,
          source: 'Website Consultation Desk',
        }),
      });
      const json = (await res.json()) as {
        syncStatus?: 'synced' | 'pending_config' | 'failed';
        pipedriveDealId?: string;
        pipedrivePersonId?: string;
      };
      if (json.syncStatus) {
        pipedriveSyncStatus = json.syncStatus;
        pipedriveDealId = json.pipedriveDealId;
        pipedrivePersonId = json.pipedrivePersonId;
      }
    } catch {
      pipedriveSyncStatus = 'pending';
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', orderId), {
      trackingCode,
      fullName: name.trim().slice(0, 120),
      countryCode,
      whatsappNumber: cleanedPhone,
      ...(email.trim() ? { email: email.trim().slice(0, 200) } : {}),
      jurisdiction,
      authority:
        jurisdiction === 'Mainland' ? 'Dubai Economy & Tourism (DET)' : 'Meydan / IFZA Free Zone',
      businessActivity: 'Advisory Consultation Inquiry',
      visaCount: 1,
      packageId: jurisdiction === 'Mainland' ? 'mainland-llc' : 'one-visa',
      packageName: jurisdiction === 'Mainland' ? 'Mainland LLC' : '1-Visa All-Inclusive',
      estimatedTotalAed,
      status: 'New Lead',
      currentStep: 1,
      source: 'Website Consultation Desk',
      pipedriveSyncStatus,
      ...(pipedriveDealId ? { pipedriveDealId } : {}),
      ...(pipedrivePersonId ? { pipedrivePersonId } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'orderStatus', trackingCode), {
      trackingCode,
      jurisdiction,
      authority:
        jurisdiction === 'Mainland' ? 'Dubai Economy & Tourism (DET)' : 'Meydan / IFZA Free Zone',
      packageName: jurisdiction === 'Mainland' ? 'Mainland LLC' : '1-Visa All-Inclusive',
      visaCount: 1,
      estimatedTotalAed,
      status: 'New Lead',
      currentStep: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      setSubmittedRef(trackingCode);
      onQuoteCreated(trackingCode);
      setName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Regulatory Guides Library */}
        <div className="space-y-6 lg:col-span-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111827]">
                {menuItem?.pageTitle || 'UAE Regulatory Guides'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {menuItem?.pageSubtitle ||
                  'Founder briefings maintained by our Dubai corporate compliance team.'}
              </p>
              {menuItem?.pageBody && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{menuItem.pageBody}</p>
              )}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter guides..."
                className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-3 text-xs text-[#1E293B] backdrop-blur focus:border-[#ff0031] focus:outline-none sm:w-52"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="spatial-glass rounded-2xl p-6 transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#008A72]">{post.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>By {post.authorName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{post.readTimeMinutes} min read</span>
                </div>
                <h2 className="mt-2 font-display text-xl font-bold text-[#111827]">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
                <button
                  type="button"
                  onClick={() => onOpenArticle(post)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#ff0031] hover:text-[#D90029]"
                >
                  <span>Read full guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        </div>

        {/* Online Consultation Desk Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleConsultationSubmit}
            className="spatial-glass sticky top-24 space-y-4 rounded-2xl p-6 sm:p-7"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff0031] text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#111827]">
                  Book an Online Consultation
                </h2>
                <p className="text-xs text-slate-500">
                  15-minute structuring &amp; banking feasibility call
                </p>
              </div>
            </div>

            {submittedRef ? (
              <div className="space-y-3 rounded-xl border border-[#00b294]/40 bg-[#00b294]/[0.08] p-4 text-xs text-[#111827]">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-[#00b294]" />
                  <span>Consultation Scheduled · Ref {submittedRef}</span>
                </div>
                <p>
                  Your inquiry has been logged in our operations console and Pipedrive CRM. An
                  advisor will contact you via WhatsApp shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedRef(null)}
                  className="font-bold text-[#008A72] underline"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E293B]">
                    Preferred Jurisdiction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Free Zone', 'Mainland'] as JurisdictionType[]).map((j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setJurisdiction(j)}
                        className={`min-h-[44px] rounded-xl border text-xs font-semibold transition-colors ${
                          jurisdiction === j
                            ? 'border-[#111827] bg-[#111827] text-white'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        {j}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E293B]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:border-[#ff0031] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E293B]">
                    WhatsApp Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="min-h-[46px] w-28 shrink-0 rounded-xl border border-slate-300 bg-white px-2 font-mono text-xs"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="50 482 9100"
                      className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm focus:border-[#ff0031] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E293B]">
                    Work Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:border-[#ff0031] focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#ff0031] px-5 text-sm font-bold text-white transition-colors hover:bg-[#D90029] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <span>{menuItem?.ctaLabel || 'Request Advisor Callback'}</span>
                  )}
                </button>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#00b294]" />
                  <span>Direct WhatsApp consultation · No brokerage fees</span>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export function CustomMenuPage({
  menuItem,
  onStartQuote,
}: {
  menuItem: NavMenuItem;
  onStartQuote: (jurisdiction: JurisdictionType, visaCount: number) => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="spatial-glass rounded-3xl p-7 sm:p-10">
        <p className="text-xs font-semibold tracking-wide text-[#ff0031]">{menuItem.label}</p>
        <h1
          className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
          style={{ textWrap: 'balance' }}
        >
          {menuItem.pageTitle}
        </h1>
        {menuItem.pageSubtitle && (
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
            {menuItem.pageSubtitle}
          </p>
        )}

        {menuItem.pageBody && (
          <div className="mt-6 space-y-4 whitespace-pre-line border-t border-slate-200/80 pt-6 text-sm leading-relaxed text-slate-700 sm:text-base">
            {menuItem.pageBody}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onStartQuote('Free Zone', 1)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#ff0031] px-5 text-sm font-bold text-white transition-colors hover:bg-[#D90029]"
          >
            <span>{menuItem.ctaLabel || 'Calculate My Setup Cost'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

