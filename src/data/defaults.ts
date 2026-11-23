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
  heroHeadline: 'Launch Your Dubai Company in 48 Hours',
  heroSubheadline:
    'Government-registered UAE Free Zone & Mainland company formation with transparent fixed AED pricing and direct corporate banking support.',
  whatsappNumber: '971504829100',
  phoneDisplay: 'WhatsApp Desk',
  googleRatingScore: '4.9/5',
  googleReviewCount: '300+ Founders',
  zeroVisaPriceAed: 5000,
  oneVisaPriceAed: 10900,
  mainlandPriceAed: 12900,
  promoNotice: 'Lowest Price Guarantee · UAE Company Formation Starting From AED 5,000 · Fixed 3-Year Renewal Rate',
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
    pageTitle: 'Launch Your Dubai Company in 48 Hours',
    pageSubtitle:
      'Government-registered UAE Free Zone & Mainland company formation with transparent fixed AED pricing and direct corporate banking support.',
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
    unitCostAed: 5000,
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
    unitCostAed: 10900,
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
    unitCostAed: 12900,
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
      'Opening a corporate bank account in the UAE is often the deciding milestone for newly incorporated founders. Digital-first banks such as Wio Business and Mashreq NeoBiz have shortened onboarding from six weeks to as little as 3 to 5 business days once your UAE trade license and Emirates ID are active.\n\nTo pass compliance on the first submission, prepare: (1) a clear 1-page business model summary with target client regions, (2) 6 months of personal bank statements showing initial capital, (3) verified passport and Emirates ID copies, and (4) matching website and domain credentials.\n\nOur compliance desk pre-vets every application before bank submission so international founders—including applicants from Pakistan, the UK, India, and GCC countries—avoid avoidable compliance rejections.',
    readTimeMinutes: 4,
    authorName: 'Tariq Al Mansoori',
    status: 'published',
  },
  {
    title: 'Dubai Free Zone vs Mainland LLC: Choosing the Right Jurisdiction',
    slug: 'dubai-free-zone-vs-mainland-llc-guide',
    category: 'Jurisdiction Guide',
    excerpt:
      'Compare 100% foreign ownership, local UAE trading rights, office Ejari requirements, and annual renewal costs across Meydan, RAKEZ, and Dubai Mainland.',
    content:
      'Both Free Zone and Dubai Mainland companies now grant 100% foreign ownership for over 1,000 commercial and professional activities. The right choice depends on where your customers sit and how many residence visas your team needs.\n\nFree Zones like Meydan and RAKEZ are ideal for international consultancies, SaaS founders, e-commerce sellers, and holding companies that do not require a physical retail storefront in Dubai. You receive your e-license within 48 hours with zero physical office lease required.\n\nMainland LLCs licensed under Dubai Economy & Tourism (DET) allow unrestricted direct B2B and B2C invoicing across the UAE mainland and government tenders, with scalable visa quotas tied to workspace size.',
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

export const FAQ_ITEMS = [
  {
    question: 'Can Pakistani, Indian, UK, and international founders open a corporate bank account?',
    answer:
      'Yes. We support founders across 60+ nationalities with dedicated compliance pre-screening. Digital UAE business banks like Wio Business and Mashreq NeoBiz open accounts within 3–5 business days once your Emirates ID is issued, and we prepare your KYC file, business profile, and bank interview brief.',
  },
  {
    question: 'Are there any hidden renewal fees or surprise government charges?',
    answer:
      'No. Every quote itemizes government license fees, establishment card, visa allocation, and medical/Emirates ID fees upfront in AED. Your annual renewal rate is locked and disclosed on day one with zero hidden PRO surcharges.',
  },
  {
    question: 'Can I register my Dubai company 100% remotely without travelling?',
    answer:
      'Yes. Company incorporation, trade name approval, and digital E-License issuance happen 100% remotely within 48 hours. If you select a visa package, you only visit Dubai for 3 business days to complete your medical test and Emirates ID biometrics.',
  },
  {
    question: 'How does the 0% personal income tax and UAE corporate tax work?',
    answer:
      'The UAE levies 0% personal income tax on salaries and dividends. Qualifying Free Zone businesses earning qualifying income can benefit from 0% corporate tax, while mainland profits below AED 375,000 are also taxed at 0%.',
  },
];

export function calculateSetupBreakdown(
  jurisdiction: JurisdictionType,
  visaCount: number,
  cms: Omit<CmsLandingConfig, 'updatedAt'>
): CostBreakdown {
  const cleanVisas = Math.max(0, Math.min(10, Math.round(visaCount)));

  if (jurisdiction === 'Mainland') {
    const baseMainland = cms.mainlandPriceAed || 12900;
    const extraVisas = Math.max(0, cleanVisas - 1);
    const visaAllocationAed = cleanVisas === 0 ? 0 : 2600 + extraVisas * 3100;
    const emiratesIdMedicalAed = cleanVisas * 1050;
    const establishmentCardAed = 1450;
    const bankSupportFeeAed = 0;
    const licenseFeeAed = Math.max(
      5200,
      baseMainland - establishmentCardAed - 2600 - 1050 - bankSupportFeeAed
    );
    const totalAed =
      licenseFeeAed + establishmentCardAed + visaAllocationAed + emiratesIdMedicalAed + bankSupportFeeAed;

    return {
      packageId: 'mainland-llc',
      packageName: 'Mainland LLC',
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
    const totalAed = cms.zeroVisaPriceAed || 5000;
    const bankSupportFeeAed = 0;
    const establishmentCardAed = 850;
    const licenseFeeAed = Math.max(1000, totalAed - establishmentCardAed);
    return {
      packageId: 'zero-visa',
      packageName: 'Zero-Visa License',
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

  const baseOneVisa = cms.oneVisaPriceAed || 10900;
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
    packageName: cleanVisas === 1 ? '1-Visa All-Inclusive' : `Free Zone (${cleanVisas}-Visa)`,
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

