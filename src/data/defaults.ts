import type {
  BlogPost,
  CmsLandingConfig,
  CostBreakdown,
  InventoryItem,
  JurisdictionType,
  NavMenuItem,
  OrderWorkflowStatus,
} from '../types/domain';

export const ORDER_STEPS: { step: number; status: OrderWorkflowStatus; label: string; summary: string }[] = [
  { step: 1, status: 'New Lead', label: 'Quote Locked', summary: 'Package and jurisdiction confirmed' },
  { step: 2, status: 'KYC Submitted', label: 'Submit Passport', summary: 'Passport & KYC verification complete' },
  { step: 3, status: 'Trade Name Approved', label: 'Name Approval', summary: 'DED or Free Zone name reserved' },
  { step: 4, status: 'E-License Issued', label: 'E-License in 48h', summary: 'Digital trade license issued' },
  { step: 5, status: 'Emirates ID & Bank', label: 'ID & Corporate Bank', summary: 'Biometrics & bank onboarding' },
  { step: 6, status: 'Completed', label: 'Active Company', summary: 'Fully operational UAE entity' },
];

export const BUSINESS_ACTIVITIES = [
  'E-Commerce & Online Retail',
  'Software, SaaS & IT Consultancy',
  'Management & Business Consulting',
  'Digital Marketing & Media Agency',
  'General Trading & Import/Export',
  'Real Estate Brokerage & Advisory',
  'Holding & Investment Structure',
];

export const COUNTRY_CODES = [
  { code: '+971', label: 'UAE (+971)', tzHints: ['Asia/Dubai'] },
  { code: '+92', label: 'PK (+92)', tzHints: ['Asia/Karachi'] },
  { code: '+44', label: 'UK (+44)', tzHints: ['Europe/London'] },
  { code: '+91', label: 'IN (+91)', tzHints: ['Asia/Kolkata', 'Asia/Calcutta'] },
  { code: '+966', label: 'SA (+966)', tzHints: ['Asia/Riyadh'] },
  { code: '+1', label: 'US (+1)', tzHints: ['America/New_York', 'America/Los_Angeles', 'America/Chicago'] },
  { code: '+49', label: 'DE (+49)', tzHints: ['Europe/Berlin'] },
  { code: '+65', label: 'SG (+65)', tzHints: ['Asia/Singapore'] },
];

export function detectDefaultCountryCode(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = COUNTRY_CODES.find((c) => c.tzHints.includes(tz));
    if (match) return match.code;
    const lang = navigator.language || '';
    if (lang.includes('PK')) return '+92';
    if (lang.includes('GB')) return '+44';
    if (lang.includes('IN')) return '+91';
  } catch {
    // Fallback to UAE
  }
  return '+971';
}

export const DEFAULT_CMS_LANDING: Omit<CmsLandingConfig, 'updatedAt'> = {
  heroHeadline: 'Dubai Company Formation in 48 Hours',
  heroSubheadline:
    'Government-registered UAE Free Zone & Dubai Mainland company setup with itemized Authority Fees vs. Venture Zone Service Fees and dedicated corporate banking coordination.',
  whatsappNumber: '971504829100',
  phoneDisplay: 'WhatsApp Desk',
  googleRatingScore: '4.9/5',
  googleReviewCount: '300+ Founders',
  zeroVisaPriceAed: 5999,
  oneVisaPriceAed: 10500,
  mainlandPriceAed: 10999,
  promoNotice: 'Transparent Gov + Service Fee Split · 0-Visa Setup AED 5,999 · 48h Digital E-License',
  siteName: 'venturezoneuae.com',
  logoDataUrl: '/assets/aistudio/Venture-Zone-Logo_0a72a1ee.png',
  footerLogoDataUrl: '/assets/aistudio/Venture-Zone-Logos-white_949ee09f.png',
  faviconDataUrl: '/assets/aistudio/Logo-icon_e4a5711a.png',
  socialLinkedin: 'https://www.linkedin.com',
  socialInstagram: 'https://www.instagram.com',
  socialX: 'https://x.com',
  socialYoutube: '',
  socialFacebook: '',
};

export const DEFAULT_NAV_MENU_ITEMS: Omit<NavMenuItem, 'updatedAt'>[] = [
  {
    id: 'home',
    label: 'Home',
    slug: 'home',
    order: 1,
    visible: true,
    isBuiltIn: true,
    pageTitle: 'Dubai Company Formation in 48 Hours',
    pageSubtitle:
      'Government-registered UAE Free Zone & Dubai Mainland company setup with itemized Authority Fees vs. Venture Zone Service Fees and dedicated corporate banking coordination.',
    pageBody: '',
    ctaLabel: 'Calculate My Setup Cost',
  },
  {
    id: 'free-zones',
    label: 'Free Zones',
    slug: 'free-zones',
    order: 2,
    visible: true,
    isBuiltIn: true,
    pageTitle: '100% Foreign-Owned Dubai Free Zone Companies',
    pageSubtitle:
      'Incorporate remotely within 48 hours without renting a physical office. Compare licensed UAE Free Zones side-by-side and launch directly into our cost calculator.',
    pageBody:
      'Dubai Free Zones grant 100% foreign ownership, 0% personal income tax, full repatriation of capital and profits, and fast digital license issuance.',
    ctaLabel: 'Calculate Free Zone Setup',
  },
  {
    id: 'mainland',
    label: 'Mainland',
    slug: 'mainland',
    order: 3,
    visible: true,
    isBuiltIn: true,
    pageTitle: 'Dubai Mainland LLC Formation With 100% Ownership',
    pageSubtitle:
      'Trade directly across the entire UAE local market, open retail storefronts, and bid on government tenders with full foreign shareholding and scalable visa quotas.',
    pageBody:
      'Licensed under Dubai Economy & Tourism (DET), a Mainland LLC enables unrestricted B2B and B2C contracts throughout all seven Emirates.',
    ctaLabel: 'Quote Mainland LLC',
  },
  {
    id: 'banking',
    label: 'Banking',
    slug: 'banking',
    order: 4,
    visible: true,
    isBuiltIn: true,
    pageTitle: 'UAE Business Bank Accounts & 2-Year Investor Visas',
    pageSubtitle:
      'Compliance pre-screening for international founders with direct onboarding introductions to Wio Business, Mashreq NeoBiz, and traditional UAE banks.',
    pageBody:
      'Every formation file is pre-vetted by our compliance desk before submission to UAE digital and tier-1 corporate banks.',
    ctaLabel: 'Quote 1-Visa + Banking Package',
  },
  {
    id: 'guides',
    label: 'Guides',
    slug: 'guides',
    order: 5,
    visible: true,
    isBuiltIn: true,
    pageTitle: 'UAE Regulatory Guides',
    pageSubtitle: 'Founder briefings maintained by our Dubai corporate compliance team.',
    pageBody:
      'Stay updated on UAE corporate tax thresholds, remote formation procedures, and banking KYC requirements.',
    ctaLabel: 'Request Advisor Callback',
  },
];

export const DEFAULT_INVENTORY_SEED: Omit<InventoryItem, 'updatedAt'>[] = [
  {
    id: 'inv_meydan_zero',
    name: 'All UAE Free Zones Zero-Visa Quota',
    category: 'License Quota',
    packageKey: 'zero-visa',
    stockLevel: 14,
    maxCapacity: 30,
    lowThreshold: 8,
    alertEnabled: true,
    alertChannel: 'Dashboard Banner',
    unitCostAed: 5999,
  },
  {
    id: 'inv_ifza_one_visa',
    name: 'All UAE Free Zones 1-Visa Allocation',
    category: 'Visa Allocation',
    packageKey: 'one-visa',
    stockLevel: 5,
    maxCapacity: 25,
    lowThreshold: 7,
    alertEnabled: true,
    alertChannel: 'Ops Slack Channel',
    unitCostAed: 10500,
  },
  {
    id: 'inv_ded_mainland',
    name: 'Dubai Economy Mainland LLC Slots',
    category: 'License Quota',
    packageKey: 'mainland-llc',
    stockLevel: 9,
    maxCapacity: 20,
    lowThreshold: 5,
    alertEnabled: true,
    alertChannel: 'Dashboard Banner',
    unitCostAed: 10999,
  },
  {
    id: 'inv_wio_bank_fasttrack',
    name: 'Wio & Mashreq Priority Banking Slots',
    category: 'Banking Slot',
    packageKey: 'banking',
    stockLevel: 4,
    maxCapacity: 20,
    lowThreshold: 6,
    alertEnabled: true,
    alertChannel: 'Ops Slack Channel',
    unitCostAed: 500,
  },
  {
    id: 'inv_vip_emirates_medical',
    name: 'Emirates ID VIP Medical Vouchers',
    category: 'VIP Medical',
    packageKey: 'medical',
    stockLevel: 18,
    maxCapacity: 40,
    lowThreshold: 10,
    alertEnabled: true,
    alertChannel: 'Daily Digest',
    unitCostAed: 650,
  },
];

export const DEFAULT_BLOG_POSTS: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Corporate Bank Account Approval in Dubai for International Founders',
    slug: 'corporate-bank-account-dubai-international-founders',
    category: 'Banking & Compliance',
    excerpt:
      'A practical breakdown of KYC documentation, source-of-wealth checks, and digital banking timelines with Wio Business and Mashreq NeoBiz.',
    content:
      'Opening a corporate bank account in the UAE is often the deciding milestone for newly incorporated founders. Digital-first banks such as Wio Business and Mashreq NeoBiz typically complete reviews in 3 to 7 business days once your UAE trade license and Emirates ID are active.\n\nTo pass compliance on the first submission, prepare: (1) a clear 1-page business model summary with target client regions, (2) 6 months of personal bank statements showing initial capital, (3) verified passport and Emirates ID copies, and (4) matching website and domain credentials.\n\nOur compliance desk pre-vets every application before bank submission so international founders—including applicants from Pakistan, the UK, India, and GCC countries—minimize avoidable compliance queries. Final account approval always rests with the issuing bank.',
    readTimeMinutes: 4,
    authorName: 'Tariq Al Mansoori',
    status: 'published',
  },
  {
    title: 'Dubai Free Zone vs Mainland LLC: Choosing the Right Jurisdiction',
    slug: 'dubai-free-zone-vs-mainland-llc-guide',
    category: 'Jurisdiction Guide',
    excerpt:
      'Compare 100% foreign ownership, local UAE trading rights, office Ejari requirements, and annual renewal costs across UAE Free Zones and Dubai Mainland.',
    content:
      'Both Free Zone and Dubai Mainland companies now grant 100% foreign ownership for over 1,000 commercial and professional activities. The right choice depends on where your customers sit and how many residence visas your team needs.\n\nFree Zones are ideal for international consultancies, SaaS founders, e-commerce sellers, and holding companies that do not require a physical retail storefront in Dubai. You receive your e-license within 48 hours with zero physical office lease required.\n\nMainland LLCs licensed under Dubai Economy & Tourism (DET) allow unrestricted direct B2B and B2C invoicing across the UAE mainland and government tenders, with scalable visa quotas tied to workspace size.',
    readTimeMinutes: 5,
    authorName: 'Nadia Farooq',
    status: 'published',
  },
  {
    title: 'How Remote Company Formation Works Without Flying to the UAE',
    slug: 'remote-dubai-company-formation-48-hours',
    category: 'Remote Setup',
    excerpt:
      'Complete trade name reservation, MOA e-signing, and digital license issuance from abroad—and when to schedule your 3-day biometrics visit.',
    content:
      'You do not need to reside in Dubai to incorporate your UAE company. Trade name reservation, security clearance, and digital Memorandum of Association (MOA) execution happen remotely through verified government portals.\n\nWithin 48 hours of submitting your passport scan and activity selection, your electronic trade license and Certificate of Incorporation are issued. If your package includes a UAE Residence Visa, you only need to travel to Dubai once for a single 3-business-day medical and Emirates ID biometrics appointment—coordinated end-to-end by our PRO desk.',
    readTimeMinutes: 3,
    authorName: 'Omar Siddiqui',
    status: 'published',
  },
];

export interface PricingFeeSplitRow {
  id: string;
  packageName: string;
  idealUseCase: string;
  authorityFeeAed: number;
  serviceFeeAed: number;
  totalAed: number;
  year2RenewalRange: string;
  highlights: string;
}

export const PRICING_FEE_SPLIT_TABLE: PricingFeeSplitRow[] = [
  {
    id: 'zero-visa',
    packageName: '0-Visa UAE Free Zone',
    idealUseCase: 'Remote consultants, SaaS, e-commerce & holding entities',
    authorityFeeAed: 5200,
    serviceFeeAed: 799,
    totalAed: 5999,
    year2RenewalRange: 'AED 5,200 – 6,200 / yr',
    highlights: '100% Ownership · Up to 3 Activities · 48h Digital E-License',
  },
  {
    id: 'one-visa',
    packageName: '1-Visa Free Zone (All-Inclusive)',
    idealUseCase: 'Solo founders relocating or applying for UAE business banking',
    authorityFeeAed: 8750,
    serviceFeeAed: 1750,
    totalAed: 10500,
    year2RenewalRange: 'AED 7,800 – 9,200 / yr',
    highlights: 'License + Establishment Card + 1 Visa Quota + EID & Bank Support',
  },
  {
    id: 'mainland-llc',
    packageName: 'Dubai Mainland Instant Setup (DET)',
    idealUseCase: 'Local UAE B2B/B2C trade, retail storefronts & gov tenders',
    authorityFeeAed: 9199,
    serviceFeeAed: 1800,
    totalAed: 10999,
    year2RenewalRange: 'AED 8,500 – 11,500 / yr',
    highlights: 'DET LLC + 100% Ownership + 1 Investor Visa + Flexi/Ejari Options',
  },
];

export const OPTIONAL_ADDONS = [
  {
    name: 'Additional 2-Year Investor / Employee Visa',
    cost: 'From AED 2,950 + EID/Medical',
    note: 'Authority quota allocation & immigration typing per added visa',
  },
  {
    name: 'Establishment Card & E-Channel (0-Visa Upgrade)',
    cost: 'AED 850 – AED 1,450',
    note: 'Required only if upgrading a 0-visa company for residency sponsorship',
  },
  {
    name: 'Medical Fitness & Emirates ID Biometrics Typing',
    cost: 'AED 950 – AED 1,050',
    note: 'Government pass-through fee (VIP 6-hour medical option available)',
  },
  {
    name: 'Corporate Tax Registration (FTA)',
    cost: 'AED 750 one-time',
    note: 'Mandatory Federal Tax Authority registration after license issuance',
  },
  {
    name: 'VAT Registration & Compliance Advisory',
    cost: 'AED 1,250 one-time',
    note: 'Mandatory above AED 375,000 taxable revenue; voluntary above AED 187,500',
  },
  {
    name: 'Corporate Bank KYC Pre-Vetting & Coordination',
    cost: 'Included (1-Visa & Mainland)',
    note: 'Document preparation & onboarding with Wio, Mashreq, or RAKBANK',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Are there any hidden charges? How do you split Government vs. Service Fees?',
    answer:
      'Zero hidden markups. Every quote separates the direct UAE Authority / Government fee (license issuance, Establishment Card, visa quota) from Venture Zone’s fixed professional service fee (starting at AED 799 on 0-Visa setups). Optional items like Corporate Tax registration (AED 750) or extra visas are disclosed upfront before payment.',
  },
  {
    question: 'What should I expect for Year 2 renewal costs?',
    answer:
      'Year 2 renewals depend on your issuing Free Zone or Mainland authority, workspace tier (Flexi-Desk vs. Ejari), and active visa count. Expect approximately AED 5,200–6,200/year for a 0-Visa Free Zone license, AED 7,800–9,200/year for a 1-Visa Free Zone license (visas themselves renew every 2 years), and AED 8,500–11,500/year for Dubai Mainland DET renewals.',
  },
  {
    question: 'Is UAE corporate bank account approval guaranteed?',
    answer:
      'No agency can ethically guarantee bank approval, because final KYC/AML and risk sign-off rests strictly with each licensed UAE bank. What Venture Zone delivers is compliance pre-vetting, business profile & source-of-funds preparation, and direct onboarding coordination with Wio Business, Mashreq NeoBiz, and RAKBANK to maximize first-pass approval.',
  },
  {
    question: 'How fast is the setup timeline for the license, visa, and bank account?',
    answer:
      'Trade name reservation and digital E-License issuance typically take 48 hours for express UAE Free Zones and Dubai Mainland Instant Licenses (2–5 working days across all authorities). Residence Visa & Emirates ID biometrics take ~3 business days once in Dubai, followed by 3–7 business days for digital business bank onboarding.',
  },
  {
    question: 'Should I choose a UAE Free Zone or Dubai Mainland LLC?',
    answer:
      'Choose a UAE Free Zone (from AED 5,999) if you serve international clients, run e-commerce, SaaS, or consulting, and want 100% remote incorporation without leasing an office. Choose a Dubai Mainland Instant LLC (AED 10,999) if you invoice local UAE B2C customers directly, open retail premises, or bid on UAE government tenders.',
  },
  {
    question: 'How do 0% personal income tax and UAE Corporate Tax apply?',
    answer:
      'The UAE levies 0% personal income tax on salaries and dividends. For corporate tax, Mainland businesses and non-qualifying income pay 0% on annual net profits up to AED 375,000 (9% above), while Qualifying Free Zone Persons meeting substance rules qualify for 0% corporate tax on qualifying income.',
  },
];

export function calculateSetupBreakdown(
  jurisdiction: JurisdictionType,
  visaCount: number,
  cms: Omit<CmsLandingConfig, 'updatedAt'>
): CostBreakdown {
  const cleanVisas = Math.max(0, Math.min(10, Math.round(visaCount)));

  if (jurisdiction === 'Mainland') {
    const baseMainland = cms.mainlandPriceAed || 10999;
    const extraVisas = Math.max(0, cleanVisas - 1);
    const visaAllocationAed = cleanVisas === 0 ? 0 : 2600 + extraVisas * 3100;
    const emiratesIdMedicalAed = cleanVisas * 1050;
    const establishmentCardAed = 1450;
    const bankSupportFeeAed = 0;
    const licenseFeeAed = Math.max(
      4000,
      baseMainland - establishmentCardAed - 2600 - 1050 - bankSupportFeeAed
    );
    const totalAed =
      licenseFeeAed + establishmentCardAed + visaAllocationAed + emiratesIdMedicalAed + bankSupportFeeAed;

    return {
      packageId: 'mainland-llc',
      packageName: 'Dubai Mainland Instant LLC',
      authority: 'Dubai Economy & Tourism (DET)',
      licenseFeeAed,
      establishmentCardAed,
      visaAllocationAed,
      emiratesIdMedicalAed,
      bankSupportFeeAed,
      totalAed,
      totalUsd: Math.round(totalAed / 3.6725),
    };
  }

  // Free Zone (covers all UAE Free Zone authorities)
  if (cleanVisas === 0) {
    const totalAed = cms.zeroVisaPriceAed || 5999;
    const bankSupportFeeAed = 0;
    const establishmentCardAed = 799; // Venture Zone Service Fee + admin filing on 0-Visa breakdown
    const licenseFeeAed = Math.max(1000, totalAed - establishmentCardAed);
    return {
      packageId: 'zero-visa',
      packageName: '0-Visa Free Zone License',
      authority: 'All UAE Free Zone Authorities',
      licenseFeeAed,
      establishmentCardAed,
      visaAllocationAed: 0,
      emiratesIdMedicalAed: 0,
      bankSupportFeeAed,
      totalAed,
      totalUsd: Math.round(totalAed / 3.6725),
    };
  }

  const baseOneVisa = cms.oneVisaPriceAed || 10500;
  const extraVisas = Math.max(0, cleanVisas - 1);
  const establishmentCardAed = 1250;
  const visaAllocationAed = 2400 + extraVisas * 2950;
  const emiratesIdMedicalAed = cleanVisas * 950;
  const bankSupportFeeAed = 0; // Included complimentary in 1-Visa All-Inclusive
  const licenseFeeAed = Math.max(4150, baseOneVisa - establishmentCardAed - 2400 - 950);
  const totalAed =
    licenseFeeAed + establishmentCardAed + visaAllocationAed + emiratesIdMedicalAed + bankSupportFeeAed;

  return {
    packageId: cleanVisas === 1 ? 'one-visa' : 'freezone-multi-visa',
    packageName: cleanVisas === 1 ? '1-Visa Free Zone (All-Inclusive)' : `Free Zone (${cleanVisas}-Visa)`,
    authority: 'All UAE Free Zone Authorities',
    licenseFeeAed,
    establishmentCardAed,
    visaAllocationAed,
    emiratesIdMedicalAed,
    bankSupportFeeAed,
    totalAed,
    totalUsd: Math.round(totalAed / 3.6725),
  };
}

export const DMCC_BOOKLET_CATEGORIES = [
  {
    group: 'Business Centres & Workspaces',
    items: [
      { name: 'Flexi Desks', offerAed: 5000, standardAed: 15000, detail: 'Up to 3 Visas · Annual' },
      { name: 'Co-Working Desks', offerAed: 8500, standardAed: 18000, detail: 'Up to 3 Visas · Annual' },
      { name: 'Serviced Desks', offerAed: 12000, standardAed: 24000, detail: 'Up to 3 Visas · Annual' },
      { name: 'Serviced Offices', offerAed: 18000, standardAed: 34000, detail: '4–8 Visas · Annual' },
    ],
  },
  {
    group: 'Premium Offices & Towers',
    items: [
      { name: 'Almas Tower Premium Offices', offerAed: 45000, standardAed: 77000, detail: '88–323 Sq.ft · 3–6 Visas' },
      { name: 'Silver Tower Premium Offices', offerAed: 28000, standardAed: 49000, detail: '140–172 Sq.ft · 3–6 Visas' },
      { name: 'Detached Premium Offices', offerAed: 28000, standardAed: 49000, detail: '137–552 Sq.ft · 3–6 Visas' },
      { name: 'J&G Premium & Fitted Offices', offerAed: 19000, standardAed: 34000, detail: '110–360 Sq.ft · 3–6 Visas' },
    ],
  },
  {
    group: 'Permits & Residency Visas',
    items: [
      { name: 'Office Sharing Permit (Annual)', offerAed: 950, standardAed: 1515, detail: 'Group / common shareholding' },
      { name: 'Dual Licence Office Permit (Annual)', offerAed: 2500, standardAed: 4000, detail: 'Operate DET Mainland from FZ' },
      { name: '1-Year Residency Visa', offerAed: 950, standardAed: 1950, detail: 'Outside UAE entry' },
      { name: '2-Year Residency Visa (Standard)', offerAed: 1450, standardAed: 2450, detail: 'Outside UAE entry' },
      { name: '2-Year Visa (50+ / 100+ / 200+ Bulk)', offerAed: 650, standardAed: 1650, detail: 'From AED 650 – AED 990' },
    ],
  },
];

