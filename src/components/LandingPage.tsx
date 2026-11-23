import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileDown,
  Loader2,
  Search,
  Star,
  X,
} from 'lucide-react';
import { downloadProposalBooklet } from '../lib/downloadBooklet';
import difcArchImg from '../assets/images/difc_spatial_arch_1794581930099.jpg';
import bankingSuiteImg from '../assets/images/dubai_banking_suite_1794581931541.jpg';
import {
  DEFAULT_BLOG_POSTS,
  DEFAULT_CMS_LANDING,
  DEFAULT_INVENTORY_SEED,
  DEFAULT_NAV_MENU_ITEMS,
  FAQ_ITEMS,
  ORDER_STEPS,
} from '../data/defaults';
import { db } from '../lib/firebase';
import type {
  BlogPost,
  CmsLandingConfig,
  InventoryItem,
  JurisdictionType,
  NavMenuItem,
  OrderStatusPublic,
} from '../types/domain';
import { CostCalculatorCard } from './CostCalculatorCard';
import { ContactPage } from './ContactPage';
import { HeroDubaiBackdropSvg } from './HeroDubaiBackdropSvg';
import { LegalPageView, isLegalSlug } from './LegalPages';
import { PartnerLogos } from './PartnerLogos';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import {
  BankingPage,
  CustomMenuPage,
  FreeZonesPage,
  GuidesContactPage,
  MainlandPage,
} from './SiteSubpages';
import { WhatsAppChatbot } from './WhatsAppChatbot';

function resolveInitialSlug(): string {
  const cleaned = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  return cleaned || 'home';
}

export function LandingPage() {
  const [currentSlug, setCurrentSlug] = useState<string>(resolveInitialSlug);
  const [cms, setCms] = useState<Omit<CmsLandingConfig, 'updatedAt'>>(DEFAULT_CMS_LANDING);
  const [navItems, setNavItems] = useState<NavMenuItem[]>(DEFAULT_NAV_MENU_ITEMS);
  const [inventory, setInventory] = useState<Omit<InventoryItem, 'updatedAt'>[]>(DEFAULT_INVENTORY_SEED);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(
    DEFAULT_BLOG_POSTS.map((p, idx) => ({ ...p, id: `default_${idx}` }))
  );

  const [preset, setPreset] = useState<{
    jurisdiction: JurisdictionType;
    visaCount: number;
    tick: number;
  } | null>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  // Live Application Progress Tracker state
  const [trackingInput, setTrackingInput] = useState('');
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<OrderStatusPublic | null>(null);
  const [trackingLookupError, setTrackingLookupError] = useState('');
  const [downloadingBooklet, setDownloadingBooklet] = useState(false);
  const [bookletError, setBookletError] = useState('');

  async function handleDownloadBooklet() {
    if (downloadingBooklet) return;
    setBookletError('');
    setDownloadingBooklet(true);
    try {
      await downloadProposalBooklet();
    } catch (err) {
      setBookletError(err instanceof Error ? err.message : 'Unable to download PDF right now.');
    } finally {
      setDownloadingBooklet(false);
    }
  }

  useEffect(() => {
    function handlePopState() {
      setCurrentSlug(resolveInitialSlug());
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigatePage(nextSlug: string) {
    const clean = nextSlug.replace(/^\/+|\/+$/g, '') || 'home';
    const nextPath = clean === 'home' ? '/' : `/${clean}`;
    window.history.pushState({}, '', nextPath);
    setCurrentSlug(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Real-time CMS Landing sync
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'cmsLanding', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CmsLandingConfig;
          const isLegacySeed = !data.siteName || data.siteName === 'Meridian Setup';
          const legacyZero = [12500, 11500].includes(data.zeroVisaPriceAed);
          const legacyOne = [18900, 17900].includes(data.oneVisaPriceAed);
          const legacyMainland = [24500, 23500].includes(data.mainlandPriceAed);
          const legacyPromo =
            !data.promoNotice ||
            data.promoNotice.startsWith('Q4 Allocation Open') ||
            data.promoNotice.startsWith('Special Offer · AED 1,000 Off');

          setCms({
            heroHeadline: data.heroHeadline || DEFAULT_CMS_LANDING.heroHeadline,
            heroSubheadline: data.heroSubheadline || DEFAULT_CMS_LANDING.heroSubheadline,
            whatsappNumber: data.whatsappNumber || DEFAULT_CMS_LANDING.whatsappNumber,
            phoneDisplay: DEFAULT_CMS_LANDING.phoneDisplay,
            googleRatingScore: data.googleRatingScore || DEFAULT_CMS_LANDING.googleRatingScore,
            googleReviewCount: data.googleReviewCount || DEFAULT_CMS_LANDING.googleReviewCount,
            zeroVisaPriceAed: legacyZero
              ? DEFAULT_CMS_LANDING.zeroVisaPriceAed
              : data.zeroVisaPriceAed || DEFAULT_CMS_LANDING.zeroVisaPriceAed,
            oneVisaPriceAed: legacyOne
              ? DEFAULT_CMS_LANDING.oneVisaPriceAed
              : data.oneVisaPriceAed || DEFAULT_CMS_LANDING.oneVisaPriceAed,
            mainlandPriceAed: legacyMainland
              ? DEFAULT_CMS_LANDING.mainlandPriceAed
              : data.mainlandPriceAed || DEFAULT_CMS_LANDING.mainlandPriceAed,
            promoNotice: legacyPromo
              ? DEFAULT_CMS_LANDING.promoNotice
              : data.promoNotice ?? DEFAULT_CMS_LANDING.promoNotice,
            siteName: isLegacySeed ? DEFAULT_CMS_LANDING.siteName : data.siteName,
            logoDataUrl: data.logoDataUrl || DEFAULT_CMS_LANDING.logoDataUrl,
            footerLogoDataUrl: data.footerLogoDataUrl || DEFAULT_CMS_LANDING.footerLogoDataUrl,
            faviconDataUrl: data.faviconDataUrl || DEFAULT_CMS_LANDING.faviconDataUrl,
            socialLinkedin: data.socialLinkedin ?? DEFAULT_CMS_LANDING.socialLinkedin,
            socialInstagram: data.socialInstagram ?? DEFAULT_CMS_LANDING.socialInstagram,
            socialX: data.socialX ?? DEFAULT_CMS_LANDING.socialX,
            socialYoutube: data.socialYoutube ?? DEFAULT_CMS_LANDING.socialYoutube,
            socialFacebook: data.socialFacebook ?? DEFAULT_CMS_LANDING.socialFacebook,
          });
        }
      },
      () => {
        // Silent fallback to defaults if doc does not exist yet
      }
    );
    return () => unsub();
  }, []);

  // Sync dynamic website name to document title
  useEffect(() => {
    const raw = cms.siteName?.trim();
    const brandName = !raw || raw === 'Meridian Setup' ? 'venturezoneuae.com' : raw;
    document.title = `${brandName} — Launch Your Dubai Company in 48 Hours`;
  }, [cms.siteName]);

  // Sync uploaded or default favicon to document head
  useEffect(() => {
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    const targetIcon = cms.faviconDataUrl || DEFAULT_CMS_LANDING.faviconDataUrl;
    if (targetIcon) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = targetIcon;
    }
  }, [cms.faviconDataUrl]);

  // Real-time Header Navbar Menu & Page Contents sync
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'navMenuItems'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs
            .map((d) => d.data() as NavMenuItem)
            .sort((a, b) => a.order - b.order);
          setNavItems(loaded);
        }
      },
      () => {
        // Keep defaults
      }
    );
    return () => unsub();
  }, []);

  // Real-time Inventory sync for package availability counts
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'inventory'),
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map((d) => d.data() as InventoryItem);
          setInventory(items);
        }
      },
      () => {
        // Keep defaults
      }
    );
    return () => unsub();
  }, []);

  // Real-time Published Blog Posts sync
  useEffect(() => {
    const q = query(collection(db, 'blogPosts'), where('status', '==', 'published'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<BlogPost, 'id'>),
            }))
            .sort((a, b) => {
              const ta = a.createdAt?.toMillis?.() || 0;
              const tb = b.createdAt?.toMillis?.() || 0;
              return tb - ta;
            });
          setBlogPosts(loaded);
        }
      },
      () => {
        // Fallback to default guides
      }
    );
    return () => unsub();
  }, []);

  // Real-time Order Status Tracker listener by exact trackingCode (zero PII)
  useEffect(() => {
    if (!activeTrackingCode) return;
    setTrackingLookupError('');
    const unsub = onSnapshot(
      doc(db, 'orderStatus', activeTrackingCode),
      (snap) => {
        if (snap.exists()) {
          setTrackedOrder(snap.data() as OrderStatusPublic);
          setTrackingLookupError('');
        } else {
          setTrackedOrder(null);
          setTrackingLookupError(
            `No active formation found for code "${activeTrackingCode}". Verify your MRD reference code.`
          );
        }
      },
      () => {
        setTrackedOrder(null);
        setTrackingLookupError('Unable to verify that reference code right now.');
      }
    );
    return () => unsub();
  }, [activeTrackingCode]);

  function selectPackageAndScroll(jurisdiction: JurisdictionType, visaCount: number) {
    setPreset({ jurisdiction, visaCount, tick: Date.now() });
    if (currentSlug !== 'home') {
      window.history.pushState({}, '', '/');
      setCurrentSlug('home');
      setTimeout(() => {
        document.getElementById('cost-calculator')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      document.getElementById('cost-calculator')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = trackingInput.trim().toUpperCase();
    if (!/^[A-Z0-9-]+$/.test(cleaned) || cleaned.length < 6) {
      setTrackingLookupError('Enter a valid reference code (e.g. MRD-4812-ABCD).');
      return;
    }
    setActiveTrackingCode(cleaned);
  }

  function getStockForPackage(packageKey: string): number | null {
    const match = inventory.find((item) => item.packageKey === packageKey);
    return match ? match.stockLevel : null;
  }

  const pricingPackages = [
    {
      key: 'zero-visa',
      title: 'Zero-Visa License',
      subtitle: 'For remote consultants & e-commerce founders',
      price: cms.zeroVisaPriceAed,
      jurisdiction: 'Free Zone' as JurisdictionType,
      visaCount: 0,
      popular: false,
      features: [
        '100% Foreign Ownership (All UAE Free Zones)',
        'Digital Trade License in 48 Hours',
        '3 Business Activities Included',
        'Corporate Bank Account Guidance',
        '0% Personal Income Tax',
      ],
    },
    {
      key: 'one-visa',
      title: '1-Visa All-Inclusive',
      subtitle: 'For solo founders relocating or opening UAE bank accounts',
      price: cms.oneVisaPriceAed,
      jurisdiction: 'Free Zone' as JurisdictionType,
      visaCount: 1,
      popular: true,
      features: [
        'Everything in Zero-Visa License',
        '2-Year UAE Investor Residence Visa',
        'Emirates ID & VIP Medical Typing',
        'Establishment Card & E-Channel',
        'Wio / Mashreq Bank Pre-Vetting',
      ],
    },
    {
      key: 'mainland-llc',
      title: 'Mainland LLC',
      subtitle: 'For local UAE trading, retail & government contracts',
      price: cms.mainlandPriceAed,
      jurisdiction: 'Mainland' as JurisdictionType,
      visaCount: 1,
      popular: false,
      features: [
        'Dubai Economy & Tourism (DET) LLC',
        'Trade Anywhere Across UAE Mainland',
        '1 Investor Visa & Establishment Card',
        'Flexi-Desk / Virtual Ejari Options',
        'Priority Corporate Bank Introduction',
      ],
    },
  ];

  const findMenuItem = (slug: string) => navItems.find((item) => item.slug === slug);
  const homeMenuItem = findMenuItem('home');
  const activeLegalSlug = isLegalSlug(currentSlug) ? currentSlug : null;
  const customMenuItem =
    !activeLegalSlug &&
    currentSlug !== 'home' &&
    currentSlug !== 'free-zones' &&
    currentSlug !== 'mainland' &&
    currentSlug !== 'banking' &&
    currentSlug !== 'guides' &&
    currentSlug !== 'contact'
      ? findMenuItem(currentSlug)
      : undefined;

  const isHomeRoute =
    currentSlug === 'home' ||
    (!activeLegalSlug &&
      !customMenuItem &&
      currentSlug !== 'free-zones' &&
      currentSlug !== 'mainland' &&
      currentSlug !== 'banking' &&
      currentSlug !== 'guides' &&
      currentSlug !== 'contact');

  const resolvedHeroHeadline =
    homeMenuItem?.pageTitle &&
    homeMenuItem.pageTitle !== DEFAULT_NAV_MENU_ITEMS[0].pageTitle &&
    cms.heroHeadline === DEFAULT_CMS_LANDING.heroHeadline
      ? homeMenuItem.pageTitle
      : cms.heroHeadline;

  const resolvedHeroSubheadline =
    homeMenuItem?.pageSubtitle &&
    homeMenuItem.pageSubtitle !== DEFAULT_NAV_MENU_ITEMS[0].pageSubtitle &&
    cms.heroSubheadline === DEFAULT_CMS_LANDING.heroSubheadline
      ? homeMenuItem.pageSubtitle
      : cms.heroSubheadline;

  return (
    <div className="min-h-screen bg-[#FAFAFB] pb-20 text-[#1E293B] md:pb-0">
      {/* Spatial UI Header Navbar */}
      <SiteHeader
        currentSlug={isHomeRoute ? 'home' : currentSlug}
        navItems={navItems}
        onNavigate={navigatePage}
        logoDataUrl={cms.logoDataUrl}
        siteName={cms.siteName}
      />

      {activeLegalSlug && (
        <main>
          <LegalPageView
            slug={activeLegalSlug}
            cms={cms}
            onNavigate={navigatePage}
            onStartQuote={selectPackageAndScroll}
          />
        </main>
      )}

      {currentSlug === 'contact' && (
        <main>
          <ContactPage cms={cms} onStartQuote={selectPackageAndScroll} />
        </main>
      )}

      {currentSlug === 'free-zones' && (
        <main>
          <FreeZonesPage
            cms={cms}
            menuItem={findMenuItem('free-zones')}
            onStartQuote={selectPackageAndScroll}
          />
        </main>
      )}

      {currentSlug === 'mainland' && (
        <main>
          <MainlandPage
            cms={cms}
            menuItem={findMenuItem('mainland')}
            onStartQuote={selectPackageAndScroll}
          />
        </main>
      )}

      {currentSlug === 'banking' && (
        <main>
          <BankingPage
            cms={cms}
            menuItem={findMenuItem('banking')}
            onStartQuote={selectPackageAndScroll}
          />
        </main>
      )}

      {currentSlug === 'guides' && (
        <main>
          <GuidesContactPage
            menuItem={findMenuItem('guides')}
            blogPosts={blogPosts}
            onOpenArticle={(post) => setActivePost(post)}
            onQuoteCreated={(code) => {
              setTrackingInput(code);
              setActiveTrackingCode(code);
            }}
          />
        </main>
      )}

      {customMenuItem && (
        <main>
          <CustomMenuPage
            menuItem={customMenuItem}
            onStartQuote={selectPackageAndScroll}
          />
        </main>
      )}

      {isHomeRoute && (
        <main id="top">
          {/* Spatial Hero with Transparent Architectural Dubai Skyline SVG Background */}
          <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FFF9FA] to-[#FAFAFB]">
            <HeroDubaiBackdropSvg />

            <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
              <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
                {/* Left Column: Spatial Glass Value Proposition */}
                <div className="flex flex-col justify-center lg:col-span-6">
                  <div className="spatial-glass-soft rounded-3xl p-6 sm:p-8">
                    {cms.promoNotice && (
                      <p className="mb-3 text-xs font-bold tracking-wide text-[#ff0031]">
                        {cms.promoNotice}
                      </p>
                    )}

                    <h1
                      className="font-display text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl"
                      style={{ textWrap: 'balance', lineHeight: 1.07 }}
                    >
                      {resolvedHeroHeadline}
                    </h1>

                    <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
                      {resolvedHeroSubheadline}
                    </p>
                    {homeMenuItem?.pageBody && (
                      <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-600">
                        {homeMenuItem.pageBody}
                      </p>
                    )}

                    {/* 3 Short Checkmark Bullets */}
                    <ul className="mt-6 space-y-3">
                      {[
                        '100% Foreign Ownership — No Local Sponsor Required',
                        'Corporate Bank Account Support (Wio, Mashreq, RAKBANK)',
                        '0% Personal Income Tax & Fixed Renewal Pricing',
                      ].map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#00b294]/15 text-[#008A72]">
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          </span>
                          <span className="text-sm font-semibold text-[#111827] sm:text-base">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Google Rating Trust Indicator */}
                    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[#ff0031]" aria-label="5 stars">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="font-mono font-bold tabular-nums text-[#111827]">
                            {cms.googleRatingScore}
                          </span>{' '}
                          Google Rating ·{' '}
                          <span className="font-semibold text-[#111827]">
                            {cms.googleReviewCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          type="button"
                          disabled={downloadingBooklet}
                          onClick={handleDownloadBooklet}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008A72] hover:text-[#00b294] disabled:opacity-60"
                        >
                          {downloadingBooklet ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileDown className="h-3.5 w-3.5" />
                          )}
                          <span>{downloadingBooklet ? 'Preparing PDF...' : 'Download Company Profile'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigatePage('free-zones')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#ff0031] hover:text-[#D90029]"
                        >
                          <span>Explore Free Zones</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {bookletError && (
                      <p className="mt-2 text-xs font-medium text-red-600">{bookletError}</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Interactive Spatial Cost Calculator Card */}
                <div className="lg:col-span-6">
                  <CostCalculatorCard
                    cms={cms}
                    selectedPreset={preset}
                    onQuoteCreated={(code) => {
                      setTrackingInput(code);
                      setActiveTrackingCode(code);
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 1: Trust & Authority Strip */}
          <PartnerLogos />

          {/* Section 2: Transparent Spatial Pricing Cards */}
          <section id="pricing" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                className="font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                Transparent UAE Formation Packages
              </h2>
              <p className="mt-3 text-base text-slate-600">
                All government fees, establishment cards, and compliance checks itemized in AED — lowest market pricing starting from AED 5,000.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  disabled={downloadingBooklet}
                  onClick={handleDownloadBooklet}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-4 text-xs font-bold text-[#111827] transition-colors hover:border-[#00b294] hover:bg-white disabled:opacity-60"
                >
                  {downloadingBooklet ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#00b294]" />
                  ) : (
                    <FileDown className="h-4 w-4 text-[#00b294]" />
                  )}
                  <span>
                    {downloadingBooklet ? 'Preparing PDF...' : 'Download Company Profile'}
                  </span>
                </button>
                {bookletError && (
                  <p className="mt-2 text-xs font-medium text-red-600">{bookletError}</p>
                )}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {pricingPackages.map((pkg) => {
                const slotsLeft = getStockForPackage(pkg.key);
                return (
                  <div
                    key={pkg.key}
                    className={`flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-transform duration-150 hover:-translate-y-0.5 ${
                      pkg.popular
                        ? 'spatial-glass ring-2 ring-[#ff0031]'
                        : 'spatial-glass-soft'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          {pkg.jurisdiction}
                        </span>
                        {pkg.popular && (
                          <span className="rounded-lg bg-[#ff0031] px-2.5 py-0.5 text-xs font-semibold text-white">
                            Most Popular
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 font-display text-xl font-bold text-[#111827]">
                        {pkg.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{pkg.subtitle}</p>

                      <div className="mt-5 flex items-baseline gap-2 border-b border-slate-200/80 pb-5">
                        <span className="font-mono text-3xl font-bold tabular-nums text-[#111827]">
                          AED {pkg.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">all-inclusive</span>
                      </div>

                      {slotsLeft !== null && (
                        <p className="mt-3 font-mono text-xs font-medium tabular-nums text-slate-500">
                          Current monthly allocation: {slotsLeft} slots remaining
                        </p>
                      )}

                      <ul className="mt-5 space-y-2.5">
                        {pkg.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-sm text-[#1E293B]">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b294]" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => selectPackageAndScroll(pkg.jurisdiction, pkg.visaCount)}
                      className={`mt-7 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${
                        pkg.popular
                          ? 'bg-[#ff0031] text-white hover:bg-[#D90029]'
                          : 'border border-[#111827] bg-white/85 text-[#111827] hover:border-[#00b294] hover:bg-[#00b294] hover:text-white'
                      }`}
                    >
                      <span>Calculate {pkg.title}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Architectural Jurisdiction & Banking Spotlight */}
          <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
              <div className="spatial-glass flex flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-7">
                <div className="relative h-56 overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={difcArchImg}
                    alt="Dubai modern commercial architecture limestone arches"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-5">
                  <div className="text-xs font-semibold text-[#ff0031]">
                    Jurisdiction Advisory
                  </div>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#111827]">
                    Free Zone vs. Dubai Mainland LLC
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Compare all UAE Free Zone authorities and Dubai Economy Mainland licenses to match your
                    client invoicing, visa quota, and tax structure.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigatePage('free-zones')}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#111827] px-4 text-xs font-bold text-white transition-colors hover:bg-[#ff0031]"
                    >
                      <span>Compare Free Zones</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigatePage('mainland')}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white/80 px-4 text-xs font-bold text-[#111827] hover:border-[#00b294] hover:bg-white"
                    >
                      <span>Mainland LLC Guide</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="spatial-glass flex flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-7">
                <div className="relative h-56 overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={bankingSuiteImg}
                    alt="Dubai corporate banking advisory executive suite"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-5">
                  <div className="text-xs font-semibold text-[#008A72]">
                    Corporate Banking &amp; Visas
                  </div>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#111827]">
                    Pre-Vetted Wio, Mashreq &amp; Investor Visa Desk
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Open multi-currency UAE business bank accounts in 3–5 business days with our
                    compliance pre-screening and 3-day Emirates ID concierge.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigatePage('banking')}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#00b294] px-4 text-xs font-bold text-white transition-colors hover:bg-[#00967C]"
                    >
                      <span>Explore Banking &amp; Visas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigatePage('guides')}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white/80 px-4 text-xs font-bold text-[#111827] hover:border-[#ff0031] hover:bg-white"
                    >
                      <span>Book Consultation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Simple 3-Step Timeline + Live Order Progress Tracker */}
          <section id="tracker" className="border-y border-slate-200/80 bg-white/60 py-14 backdrop-blur-md lg:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2
                  className="font-display text-3xl font-extrabold tracking-tight text-[#111827]"
                  style={{ textWrap: 'balance' }}
                >
                  From Passport Scan to Active Bank Account
                </h2>
                <p className="mt-3 text-base text-slate-600">
                  Three structured milestones managed by your dedicated UAE PRO desk.
                </p>
              </div>

              {/* Horizontal 3-Step Timeline */}
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  {
                    num: '01',
                    title: '1. Submit Passport',
                    desc: 'Upload your passport copy and select up to 3 business activities online in 5 minutes.',
                  },
                  {
                    num: '02',
                    title: '2. Get E-License in 48h',
                    desc: 'We secure your trade name reservation, MOA e-signing, and digital UAE license.',
                  },
                  {
                    num: '03',
                    title: '3. Receive Emirates ID & Bank Account',
                    desc: 'Complete 3-day Dubai biometrics and activate your Wio or Mashreq corporate account.',
                  },
                ].map((stepItem, idx) => (
                  <div
                    key={stepItem.num}
                    className="spatial-glass rounded-2xl p-6"
                  >
                    <div
                      className={`font-mono text-sm font-bold tabular-nums ${
                        idx === 1 ? 'text-[#008A72]' : 'text-[#ff0031]'
                      }`}
                    >
                      Step {stepItem.num}
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-[#111827]">
                      {stepItem.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{stepItem.desc}</p>
                  </div>
                ))}
              </div>

              {/* Live Application Progress Tracker */}
              <div className="spatial-glass mt-10 rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#111827]">
                      Live Formation Progress Tracker
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Already generated a quote? Enter your MRD reference code to track completed registration steps.
                    </p>
                  </div>

                  <form onSubmit={handleTrackSubmit} className="flex w-full gap-2 md:w-auto">
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="MRD-4812-ABCD"
                      aria-label="Formation tracking code"
                      className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm uppercase text-[#1E293B] placeholder:text-slate-400 focus:border-[#ff0031] focus:outline-none md:w-56"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl bg-[#ff0031] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#D90029]"
                    >
                      <Search className="h-4 w-4" />
                      <span>Track</span>
                    </button>
                  </form>
                </div>

                {trackingLookupError && (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
                    {trackingLookupError}
                  </p>
                )}

                {trackedOrder && (
                  <div className="mt-6 border-t border-slate-200/80 pt-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div>
                        <span className="font-mono font-bold text-[#111827]">
                          {trackedOrder.trackingCode}
                        </span>
                        <span className="mx-2 text-slate-300">·</span>
                        <span className="font-semibold text-[#1E293B]">
                          {trackedOrder.packageName} ({trackedOrder.jurisdiction})
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#008A72]">
                        {trackedOrder.currentStep} of {ORDER_STEPS.length} Steps Completed ·{' '}
                        {trackedOrder.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      {ORDER_STEPS.map((st) => {
                        const done = st.step <= trackedOrder.currentStep;
                        const current = st.step === trackedOrder.currentStep;
                        return (
                          <div
                            key={st.step}
                            className={`rounded-xl border p-3 ${
                              done
                                ? 'border-[#00b294]/40 bg-[#00b294]/[0.08]'
                                : 'border-slate-200 bg-white/75'
                            } ${current ? 'ring-2 ring-[#00b294]/40' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold tabular-nums text-slate-500">
                                0{st.step}
                              </span>
                              {done && <Check className="h-4 w-4 text-[#00b294]" />}
                            </div>
                            <div className="mt-1.5 text-xs font-bold text-[#111827]">{st.label}</div>
                            <div className="mt-0.5 text-[11px] leading-snug text-slate-500">
                              {st.summary}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 5: FAQ Accordion & Founder Guides */}
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              {/* FAQ Accordion */}
              <div className="lg:col-span-7">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                  Common Questions From Global Founders
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Clear answers on banking, remote registration, and renewal transparency.
                </p>

                <div className="spatial-glass mt-6 divide-y divide-slate-200/80 rounded-2xl">
                  {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={item.question}>
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                          className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        >
                          <span className="font-display text-sm font-bold text-[#111827] sm:text-base">
                            {item.question}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 text-[#ff0031] transition-transform duration-150 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Published Founder Guides (CMS-backed) */}
              <div className="lg:col-span-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-[#111827]">
                    UAE Regulatory Guides
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigatePage('guides')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff0031] hover:text-[#D90029]"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>View All</span>
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Briefings updated by our Dubai compliance team.
                </p>

                <div className="mt-6 space-y-4">
                  {blogPosts.slice(0, 3).map((post) => (
                    <article
                      key={post.id}
                      className="spatial-glass-soft rounded-2xl p-5 transition-colors hover:border-[#00b294]/50"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#008A72]">{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{post.readTimeMinutes} min read</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-base font-bold text-[#111827]">
                        {post.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
                      <button
                        type="button"
                        onClick={() => setActivePost(post)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ff0031] hover:text-[#D90029]"
                      >
                        <span>Read briefing</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Professional Spatial UI Footer */}
      <SiteFooter
        cms={cms}
        navItems={navItems}
        onNavigate={navigatePage}
      />

      {/* Sticky Mobile Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-xl shadow-[0_-4px_16px_rgba(17,24,39,0.08)] md:hidden">
        <button
          type="button"
          onClick={() => selectPackageAndScroll('Free Zone', 1)}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#ff0031] px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#D90029]"
        >
          Get Instant Quote
        </button>
      </div>

      {/* Floating WhatsApp AI Chatbot */}
      <WhatsAppChatbot
        cms={cms}
        onQuoteCreated={(code) => {
          setTrackingInput(code);
          setActiveTrackingCode(code);
        }}
      />

      {/* Article Reader Modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div className="spatial-glass max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white/95 p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#008A72]">{activePost.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>By {activePost.authorName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{activePost.readTimeMinutes} min read</span>
                </div>
                <h3
                  id="guide-modal-title"
                  className="mt-2 font-display text-2xl font-bold text-[#111827]"
                >
                  {activePost.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePost(null)}
                aria-label="Close guide"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#111827]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {activePost.content}
            </div>

            <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-200/80 pt-4">
              <button
                type="button"
                onClick={() => setActivePost(null)}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePost(null);
                  selectPackageAndScroll('Free Zone', 1);
                }}
                className="min-h-[44px] rounded-xl bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029]"
              >
                Calculate My Setup Cost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
