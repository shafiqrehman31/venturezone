import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const outDir = path.resolve('public');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'booklet.pdf');

const difcImg = path.resolve('src/assets/images/difc_spatial_arch_1794581930099.jpg');
const suiteImg = path.resolve('src/assets/images/dubai_banking_suite_1794581931541.jpg');
const logoImg = path.resolve('public/assets/aistudio/Venture-Zone-Logo_0a72a1ee.png');
const iconImg = path.resolve('public/assets/aistudio/Logo-icon_e4a5711a.png');

const COLORS = {
  navy: '#111827',
  darkNavy: '#0B0F17',
  blue: '#ff0031',
  emerald: '#00b294',
  slate: '#334155',
  muted: '#64748B',
  lightBg: '#FAFAFB',
  border: '#CBD5E1',
  white: '#FFFFFF',
  gold: '#D97706',
};

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  info: {
    Title: 'venturezoneuae.com — Company Profile & Pricing Proposal',
    Author: 'venturezoneuae.com',
    Subject: 'All UAE Free Zone Authorities & Dubai Mainland Company Formation Proposal',
  },
});

const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const PAGE_W = doc.page.width;
const PAGE_H = doc.page.height;
const CONTENT_W = PAGE_W - 96;

function drawHeaderBar(sectionTitle, pageNum) {
  let textStartX = 48;
  if (fs.existsSync(iconImg)) {
    doc.image(iconImg, 48, 21, { width: 16, height: 16 });
    textStartX = 70;
  }
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.blue)
    .text(`VENTUREZONEUAE.COM  |  ${sectionTitle.toUpperCase()}`, textStartX, 26, { width: 400, lineBreak: false });
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.navy)
    .text(String(pageNum).padStart(2, '0'), PAGE_W - 88, 26, { width: 40, align: 'right', lineBreak: false });

  doc
    .moveTo(48, 44)
    .lineTo(PAGE_W - 48, 44)
    .lineWidth(0.75)
    .strokeColor(COLORS.border)
    .stroke();
}

function drawLogoBadge(badgeX, badgeY, badgeW = 138, badgeH = 42) {
  if (!fs.existsSync(logoImg)) return;
  const imgSize = badgeW - 12;
  const imgX = badgeX + (badgeW - imgSize) / 2;
  const imgY = badgeY + badgeH / 2 - imgSize * 0.4725;
  doc.save();
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8).fill(COLORS.white);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8).lineWidth(0.75).strokeColor('#E2E8F0').stroke();
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8).clip();
  doc.image(logoImg, imgX, imgY, { width: imgSize });
  doc.restore();
}

function drawFooterBar() {
  doc
    .moveTo(48, PAGE_H - 42)
    .lineTo(PAGE_W - 48, PAGE_H - 42)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      'venturezoneuae.com  ·  Company Profile & UAE Setup Proposal  ·  Email: info@venturezoneuae.com',
      48,
      PAGE_H - 33,
      { width: CONTENT_W, align: 'center', lineBreak: false }
    );
}

function drawTable(startY, headers, rows, colWidths, rowH = 34) {
  let y = startY;

  // Header row
  doc.rect(48, y, CONTENT_W, 28).fill(COLORS.navy);
  let x = 48;
  headers.forEach((h, i) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(8.8)
      .fillColor(COLORS.white)
      .text(h, x + 8, y + 9, { width: colWidths[i] - 16, lineBreak: false });
    x += colWidths[i];
  });
  y += 28;

  rows.forEach((row, rIdx) => {
    doc.rect(48, y, CONTENT_W, rowH).fill(rIdx % 2 === 0 ? COLORS.white : COLORS.lightBg);
    doc.rect(48, y, CONTENT_W, rowH).lineWidth(0.5).strokeColor(COLORS.border).stroke();
    let cx = 48;
    row.forEach((cell, cIdx) => {
      doc
        .font(cIdx === 0 || cIdx === 1 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8.5)
        .fillColor(cIdx === 1 ? COLORS.blue : COLORS.navy)
        .text(cell, cx + 8, y + 8, { width: colWidths[cIdx] - 16, lineGap: 1.5 });
      cx += colWidths[cIdx];
    });
    y += rowH;
  });

  return y;
}

// ============================================================================
// PAGE 1: COVER PAGE
// ============================================================================
doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.white);
doc.rect(0, 0, PAGE_W, 8).fill(COLORS.navy);

if (fs.existsSync(logoImg)) {
  const coverLogoSize = 148;
  const coverLogoX = 48 - coverLogoSize * 0.095;
  const coverLogoY = 26 - coverLogoSize * 0.362;
  doc.save();
  doc.rect(48, 22, 132, 42).clip();
  doc.image(logoImg, coverLogoX, coverLogoY, { width: coverLogoSize });
  doc.restore();
} else {
  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(COLORS.navy)
    .text('venturezoneuae.com', 48, 36);
}

doc
  .font('Helvetica-Bold')
  .fontSize(10.5)
  .fillColor(COLORS.navy)
  .text('venturezoneuae.com', PAGE_W - 208, 38, { width: 160, align: 'right' });

doc
  .font('Helvetica-Bold')
  .fontSize(10)
  .fillColor(COLORS.emerald)
  .text('GET STARTED', 48, 84);

doc
  .font('Helvetica-Bold')
  .fontSize(36)
  .fillColor(COLORS.navy)
  .text('COMPANY\nPROFILE &\nPROPOSAL', 48, 102, { lineGap: 2 });

doc
  .font('Helvetica')
  .fontSize(11.5)
  .fillColor(COLORS.slate)
  .text(
    'All UAE Free Zone Authorities & Dubai Mainland Formation Packages\nRevised 2026 Lowest Market Pricing — Starting From AED 5,000',
    48,
    238,
    { width: CONTENT_W, lineGap: 4 }
  );

if (fs.existsSync(difcImg)) {
  doc.save();
  doc.roundedRect(48, 305, CONTENT_W, 330, 12).clip();
  doc.image(difcImg, 48, 305, { width: CONTENT_W, height: 330, cover: [CONTENT_W, 330] });
  doc.restore();
} else {
  doc.roundedRect(48, 305, CONTENT_W, 330, 12).fill(COLORS.navy);
}

// Bottom Cover Highlights
doc.roundedRect(48, 660, CONTENT_W, 110, 10).fill(COLORS.lightBg);
doc.roundedRect(48, 660, CONTENT_W, 110, 10).lineWidth(0.75).strokeColor(COLORS.border).stroke();

doc
  .font('Helvetica-Bold')
  .fontSize(11)
  .fillColor(COLORS.navy)
  .text('100% Foreign Ownership  ·  48-Hour E-License  ·  Direct Banking Support', 68, 682);
doc
  .font('Helvetica')
  .fontSize(9.5)
  .fillColor(COLORS.slate)
  .text(
    'Launch remotely from anywhere in the world with transparent, fixed AED pricing and dedicated advisor onboarding.',
    68,
    704,
    { width: CONTENT_W - 40 }
  );
doc
  .font('Helvetica-Bold')
  .fontSize(10)
  .fillColor(COLORS.emerald)
  .text('Email: info@venturezoneuae.com   |   https://venturezoneuae.com', 68, 738);

// ============================================================================
// PAGE 2: TABLE OF CONTENTS
// ============================================================================
doc.addPage();
doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.darkNavy);

doc
  .font('Helvetica-Bold')
  .fontSize(11)
  .fillColor(COLORS.emerald)
  .text('TABLE OF', 48, 72);
doc
  .font('Helvetica-Bold')
  .fontSize(30)
  .fillColor(COLORS.white)
  .text('CONTENTS', 48, 88);

drawLogoBadge(PAGE_W - 186, 66);

const tocItems = [
  ['03', 'About venturezoneuae.com & UAE Benefits', 'Why global founders incorporate across all UAE Free Zones'],
  ['04', 'Core Formation Packages (From AED 5,000)', 'Zero-Visa, 1-Visa All-Inclusive & Dubai Mainland LLC'],
  ['05', 'Free Zone Ecosystems (Crypto, FinX & ESG)', 'Web3, fintech, trade & sustainability hubs across UAE'],
  ['06', 'Business Centres & Workspace Rates', 'Flexi Desks, Co-Working & Serviced Offices (Lowest Rates)'],
  ['07', 'Premium Offices & Sharing Permits', 'Almas, Silver, Detached, J&G & Dual Licence Permits'],
  ['08', 'Residence Visas & Protection Insurance', '1-Year & 2-Year Visa lowest rates & EPI bands'],
  ['09', '100% Digital 3-Step Formation Process', 'From online application to active corporate bank account'],
  ['10', 'Disclaimer & Direct Advisory Contact', 'Important regulatory disclosures & email consultation'],
];

let tocY = 165;
tocItems.forEach(([num, title, sub]) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.emerald)
    .text(num, 48, tocY);
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.white)
    .text(title, 82, tocY - 1);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor('#94A3B8')
    .text(sub, 82, tocY + 17);
  doc
    .moveTo(48, tocY + 40)
    .lineTo(PAGE_W - 48, tocY + 40)
    .lineWidth(0.5)
    .strokeColor('#1E293B')
    .stroke();
  tocY += 56;
});

doc
  .font('Helvetica')
  .fontSize(8.5)
  .fillColor('#94A3B8')
  .text(
    'All prices in this Company Profile reflect venturezoneuae.com lowest-price category schedules starting from AED 5,000 across all UAE Free Zone authorities and Dubai Mainland. Official government rates and VAT rules apply where stated.',
    48,
    PAGE_H - 95,
    { width: CONTENT_W, lineGap: 3 }
  );

// ============================================================================
// PAGE 3: ABOUT VENTUREZONEUAE.COM & DUBAI BENEFITS
// ============================================================================
doc.addPage();
drawHeaderBar('About & Dubai Benefits', 3);

doc
  .font('Helvetica-Bold')
  .fontSize(24)
  .fillColor(COLORS.navy)
  .text('ABOUT VENTUREZONEUAE.COM', 48, 66);

doc
  .font('Helvetica')
  .fontSize(10.5)
  .fillColor(COLORS.slate)
  .text(
    'venturezoneuae.com empowers international founders, digital agencies, e-commerce brands, and commodities traders to incorporate seamlessly in Dubai Free Zones and Dubai Mainland. We combine transparent AED pricing with 48-hour digital e-licensing, residence visa processing, and pre-vetted UAE corporate banking introductions.',
    48,
    102,
    { width: CONTENT_W, lineGap: 4 }
  );

if (fs.existsSync(suiteImg)) {
  doc.save();
  doc.roundedRect(48, 178, CONTENT_W, 185, 10).clip();
  doc.image(suiteImg, 48, 178, { width: CONTENT_W, height: 185, cover: [CONTENT_W, 185] });
  doc.restore();
}

doc
  .font('Helvetica-Bold')
  .fontSize(18)
  .fillColor(COLORS.navy)
  .text('DUBAI & FREE ZONE ADVANTAGES', 48, 386);

const dubaiBenefits = [
  '100% Foreign Ownership — full shareholding with no local sponsor required',
  '0% Personal Income Tax and 0% Corporate Tax on qualifying Free Zone income',
  '100% Repatriation of capital and corporate profits globally',
  'No customs duties within the GCC and no minimum paid-up capital requirement',
  'Currency (AED) pegged to the US Dollar since 1997 with English business law',
  'Streamlined 1-Year & 2-Year UAE Investor & Employee Residence Visas',
  'Central East–West business time zone connecting Europe, Asia, and Africa',
  '1,000+ licensed business activities across consultancy, tech, trading, crypto & holdings',
];

let benY = 420;
dubaiBenefits.forEach((item) => {
  doc.circle(56, benY + 5, 4).fill(COLORS.emerald);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.slate)
    .text(item, 70, benY, { width: CONTENT_W - 22 });
  benY += 26;
});

// Highlight metrics strip
doc.roundedRect(48, 650, CONTENT_W, 95, 10).fill(COLORS.navy);
const stats = [
  ['#1 Hub', 'Global Free Zone access'],
  ['26,000+', 'Active member firms'],
  ['1,000+', 'Licensed activities'],
  ['48 Hours', 'Digital E-License issue'],
];
stats.forEach(([big, small], idx) => {
  const sx = 64 + idx * 124;
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.emerald).text(big, sx, 672, { width: 112 });
  doc.font('Helvetica').fontSize(8.5).fillColor('#CBD5E1').text(small, sx, 696, { width: 112 });
});

drawFooterBar();

// ============================================================================
// PAGE 4: CORE FORMATION PACKAGES (REDUCED BY AED 1,000)
// ============================================================================
doc.addPage();
drawHeaderBar('Core Formation Packages', 4);

doc
  .font('Helvetica-Bold')
  .fontSize(22)
  .fillColor(COLORS.navy)
  .text('TRANSPARENT FORMATION PACKAGES', 48, 66);

doc
  .font('Helvetica')
  .fontSize(10)
  .fillColor(COLORS.slate)
  .text(
    'Every venturezoneuae.com formation package covers all UAE Free Zone authorities and Dubai Mainland (DET) with market-lowest transparent AED pricing starting from AED 5,000.',
    48,
    98,
    { width: CONTENT_W, lineGap: 3 }
  );

let y4 = drawTable(
  142,
  ['Package Category', 'Offer Price', 'Standard', 'Key Inclusions'],
  [
    ['Zero-Visa License (All Free Zones)', 'AED 5,000', 'AED 11,500', '100% Ownership · 48h Digital License · All UAE Free Zones'],
    ['1-Visa All-Inclusive (Popular)', 'AED 10,900', 'AED 17,900', 'License + 2-Yr Investor Visa + Emirates ID + Bank Desk'],
    ['Dubai Mainland LLC (DET)', 'AED 12,900', 'AED 23,500', 'Full UAE Local Market + 1 Visa + Virtual Ejari Option'],
    ['RAKEZ / SHAMS / Ajman FZs', 'AED 5,000', 'AED 10,800', 'Lowest UAE Formation Rate · Remote E-License Setup'],
    ['Meydan Free Zone Setup', 'AED 7,500', 'AED 11,500', 'Dubai Address · Mix 3 Activities · 100% Remote'],
    ['IFZA Dubai Setup', 'AED 9,900', 'AED 13,900', 'SaaS & Trading · Wio / Mashreq Friendly · Remote'],
    ['DMCC (JLT Dubai) Package', 'AED 19,500', 'AED 28,500', '#1 Global Free Zone · Tier-1 Banking Acceptance'],
  ],
  [148, 92, 82, 177],
  36
);

doc.roundedRect(48, y4 + 28, CONTENT_W, 130, 10).fill(COLORS.lightBg);
doc.roundedRect(48, y4 + 28, CONTENT_W, 130, 10).lineWidth(0.75).strokeColor(COLORS.border).stroke();

doc
  .font('Helvetica-Bold')
  .fontSize(12)
  .fillColor(COLORS.navy)
  .text('Corporate Banking Support Included', 66, y4 + 46);
doc
  .font('Helvetica')
  .fontSize(9.5)
  .fillColor(COLORS.slate)
  .text(
    '• Pre-vetted KYC file preparation before bank submission for global founders (PK, IN, UK, EU, US, GCC)\n• Fast-track digital introductions to Wio Business (3–5 days), Mashreq NeoBiz (5–7 days), and RAKBANK\n• Transfer of Incorporation (Redomiciliation) support to relocate existing foreign companies seamlessly',
    66,
    y4 + 68,
    { width: CONTENT_W - 36, lineGap: 5 }
  );

drawFooterBar();

// ============================================================================
// PAGE 5: SPECIALISED ECOSYSTEMS (CRYPTO, FINX & SUSTAINABILITY)
// ============================================================================
doc.addPage();
drawHeaderBar('Business Ecosystems', 5);

doc
  .font('Helvetica-Bold')
  .fontSize(22)
  .fillColor(COLORS.navy)
  .text('SPECIALISED BUSINESS ECOSYSTEMS', 48, 66);

doc
  .font('Helvetica')
  .fontSize(10)
  .fillColor(COLORS.slate)
  .text(
    'Access thriving sector ecosystems in Dubai tailored for Web3, fintech, commodities, and ESG-driven enterprises.',
    48,
    98,
    { width: CONTENT_W }
  );

const ecosystems = [
  {
    title: '1. Crypto, Web3 & Blockchain Hub (750+ Members)',
    color: COLORS.blue,
    bullets: [
      'Blockchain Development, Metaverse & Web3 Consultancy licensing',
      'Crypto Proprietary Trading, Mining & Regulated Virtual Asset Activities',
      'Access to acceleration programs, ecosystem perks, hackathons & global capital',
    ],
  },
  {
    title: '2. FinX — Trade, Commodities & Financial Innovation',
    color: COLORS.navy,
    bullets: [
      'Designed for trading firms, fintechs, family offices & private investors',
      'Connect with Tradeflow, Commodities Ecosystem & Wealth Hub networks',
      'Bridge real-world commercial trade with tokenised & Web3 infrastructure',
    ],
  },
  {
    title: '3. Sustainability & ESG Hub (50+ Members)',
    color: COLORS.emerald,
    bullets: [
      'Develop corporate sustainability strategies and assign global ESG rating scores',
      'Calculate carbon footprints and offset emissions via verified projects',
      'Meet international supply-chain ESG compliance standards from Dubai',
    ],
  },
];

let ecoY = 140;
ecosystems.forEach((eco) => {
  doc.roundedRect(48, ecoY, CONTENT_W, 145, 10).fill(COLORS.lightBg);
  doc.rect(48, ecoY, 6, 145).fill(eco.color);
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.navy)
    .text(eco.title, 70, ecoY + 18);

  let by = ecoY + 46;
  eco.bullets.forEach((b) => {
    doc.font('Helvetica').fontSize(9.8).fillColor(COLORS.slate).text(`•  ${b}`, 70, by, {
      width: CONTENT_W - 40,
    });
    by += 26;
  });
  ecoY += 165;
});

drawFooterBar();

// ============================================================================
// PAGE 6: DMCC BUSINESS CENTRES & WORKSPACE RATES (- AED 1,000)
// ============================================================================
doc.addPage();
drawHeaderBar('Business Centres Rates', 6);

doc
  .font('Helvetica-Bold')
  .fontSize(22)
  .fillColor(COLORS.navy)
  .text('BUSINESS CENTRES & WORKSPACE RATES', 48, 66);

doc
  .font('Helvetica')
  .fontSize(10)
  .fillColor(COLORS.slate)
  .text(
    'All-inclusive workspace solutions across Dubai & UAE Free Zones with utilities, high-speed connectivity, and flexible lease terms—revised to market-lowest annual rates starting from AED 5,000.',
    48,
    98,
    { width: CONTENT_W, lineGap: 4 }
  );

let y6 = drawTable(
  152,
  ['Workspace Category', 'Offer Rate', 'Standard', 'Visa Eligibility'],
  [
    ['Flexi Desks', 'From AED 5,000 / year', 'AED 15,000', 'Up to 3 Visas'],
    ['Co-Working Desks', 'From AED 8,500 / year', 'AED 18,000', 'Up to 3 Visas'],
    ['Serviced Desks', 'From AED 12,000 / year', 'AED 24,000', 'Up to 3 Visas'],
    ['Serviced Offices', 'From AED 18,000 / year', 'AED 34,000', '4–8 Visas (by size)'],
  ],
  [140, 142, 95, 122],
  30
);

doc
  .font('Helvetica-Bold')
  .fontSize(13)
  .fillColor(COLORS.navy)
  .text('What Is Included With Flexible Business Centre Solutions', 48, y6 + 34);

const bcPerks = [
  'Immediate availability with zero fit-out capital expenditure',
  'All-inclusive DEWA utilities, cooling, reception, and meeting room access',
  'Streamlined Step-2 license issuance for Flexi-Desk packages (skip physical lease wait)',
  'Full eligibility for UAE corporate banking and establishment card registration',
];
let bcy = y6 + 60;
bcPerks.forEach((p) => {
  doc.circle(56, bcy + 5, 3.5).fill(COLORS.blue);
  doc.font('Helvetica').fontSize(9.8).fillColor(COLORS.slate).text(p, 70, bcy, {
    width: CONTENT_W - 22,
  });
  bcy += 24;
});

drawFooterBar();

// ============================================================================
// PAGE 7: PREMIUM OFFICES & OFFICE SHARING PERMITS
// ============================================================================
doc.addPage();
drawHeaderBar('Premium Offices & Permits', 7);

doc
  .font('Helvetica-Bold')
  .fontSize(22)
  .fillColor(COLORS.navy)
  .text('PREMIUM OFFICES & SHARING PERMITS', 48, 66);

doc
  .font('Helvetica')
  .fontSize(10)
  .fillColor(COLORS.slate)
  .text(
    'Fitted, shell-and-core, and detached executive suites across JLT & Dubai commercial towers—revised to market-lowest annual category rates.',
    48,
    98,
    { width: CONTENT_W, lineGap: 3 }
  );

let y7 = drawTable(
  142,
  ['Property Category', 'Offer Rent', 'Standard', 'Area & Visas'],
  [
    ['Almas Tower Premium Offices', 'From AED 45,000 / yr', 'AED 77,000', '88–323 Sq.ft · 3–6 Visas'],
    ['Silver Tower Premium Offices', 'From AED 28,000 / yr', 'AED 49,000', '140–172 Sq.ft · 3–6 Visas'],
    ['Detached Premium Offices', 'From AED 28,000 / yr', 'AED 49,000', '137–552 Sq.ft · 3–6 Visas'],
    ['J&G Premium Offices', 'From AED 19,000 / yr', 'AED 34,000', '110–360 Sq.ft · 3–6 Visas'],
    ['J&G Fitted Offices', 'From AED 19,000 / yr', 'AED 34,000', '129–300 Sq.ft · 3 Visas'],
  ],
  [158, 128, 82, 131],
  30
);

doc
  .font('Helvetica-Bold')
  .fontSize(15)
  .fillColor(COLORS.navy)
  .text('OFFICE SHARING & DUAL LICENCE PERMITS', 48, y7 + 34);

doc
  .font('Helvetica')
  .fontSize(9.5)
  .fillColor(COLORS.slate)
  .text(
    'Consolidate group companies, family-owned entities, or Dubai Mainland (DET) branches under one roof without renting a separate mainland office.',
    48,
    y7 + 58,
    { width: CONTENT_W }
  );

drawTable(
  y7 + 92,
  ['Permit Category', 'Offer Fee', 'Standard', 'Eligibility'],
  [
    ['Office Sharing Permit (Annual)', 'AED 950', 'AED 1,515', 'Common shareholding / group firms'],
    ['Dual Licence Office Permit (Annual)', 'AED 2,500', 'AED 4,000', 'Operate DET Mainland from Free Zone'],
  ],
  [168, 95, 82, 154],
  34
);

drawFooterBar();

// ============================================================================
// PAGE 8: RESIDENCE VISAS & EMPLOYEE PROTECTION INSURANCE
// ============================================================================
doc.addPage();
drawHeaderBar('Visa Solutions & Insurance', 8);

doc
  .font('Helvetica-Bold')
  .fontSize(22)
  .fillColor(COLORS.navy)
  .text('RESIDENCE VISA SOLUTIONS', 48, 66);

doc
  .font('Helvetica')
  .fontSize(10)
  .fillColor(COLORS.slate)
  .text(
    'Streamlined 1-Year and 2-Year UAE residency visas for founders and employees outside the UAE, revised to our lowest market processing tiers.',
    48,
    98,
    { width: CONTENT_W }
  );

let y8 = drawTable(
  134,
  ['Residency Visa Category', 'Offer Rate', 'Standard', 'Notes'],
  [
    ['1 Year Residency Visa', 'From AED 950*', 'AED 1,950', 'Outside UAE standard entry'],
    ['2 Year Residency Visa (Standard)', 'From AED 1,450*', 'AED 2,450', 'Outside UAE standard entry'],
    ['2 Year Visa (50+ Visas · 10% Tier)', 'AED 990*', 'AED 1,890', 'Volume corporate discount'],
    ['2 Year Visa (100+ Visas · 20% Tier)', 'AED 790*', 'AED 1,690', 'Volume corporate discount'],
    ['2 Year Visa (200+ Visas · 30% Tier)', 'AED 650*', 'AED 1,550', 'Enterprise volume tier'],
  ],
  [175, 108, 78, 138],
  27
);

doc
  .font('Helvetica-Bold')
  .fontSize(12.5)
  .fillColor(COLORS.navy)
  .text('Government Pass-Through Typing, Medical & Access Services', 48, y8 + 18);

y8 = drawTable(
  y8 + 38,
  ['Service', 'Authority Fee (AED)', 'Service Scope'],
  [
    ['Emirates ID Typing Service', 'AED 457', 'Official biometric application typing'],
    ['Medical Fitness Typing', 'AED 320 – AED 800', 'Normal (24h) · VIP (6h) · Smart Salem (30m)'],
    ['Group Access Approval (1/3/12 mo)', 'AED 115 / 265 / 515', 'Allow group-sponsored staff onsite'],
  ],
  [180, 125, 194],
  27
);

doc
  .font('Helvetica-Bold')
  .fontSize(12.5)
  .fillColor(COLORS.navy)
  .text('Employee Protection Insurance (Replaces Cash Deposit)', 48, y8 + 18);

drawTable(
  y8 + 38,
  ['Salary Band (AED/mo)', 'Coverage Limit', '2-Year Premium', '1-Year Premium'],
  [
    ['< 4,000', 'AED 10,000', 'AED 115 – 160', 'AED 85'],
    ['4,001 – 9,000', 'AED 20,000', 'AED 188 – 260', 'AED 140'],
    ['9,001 – 14,000', 'AED 30,000', 'AED 292 – 400', 'AED 220'],
    ['14,001 – 19,000', 'AED 40,000', 'AED 362 – 500', 'AED 270'],
    ['> 19,001', 'AED 50,000', 'AED 414 – 570', 'AED 310'],
  ],
  [135, 120, 125, 119],
  26
);

drawFooterBar();

// ============================================================================
// PAGE 9: 100% DIGITAL 3-STEP SETUP PROCESS
// ============================================================================
doc.addPage();
drawHeaderBar('100% Digital Setup Process', 9);

doc
  .font('Helvetica-Bold')
  .fontSize(22)
  .fillColor(COLORS.navy)
  .text('PROCESS — 100% DIGITAL IN 3 STEPS', 48, 66);

doc
  .font('Helvetica')
  .fontSize(10.5)
  .fillColor(COLORS.slate)
  .text(
    'Open your UAE company completely remotely without travelling to Dubai during incorporation.',
    48,
    98,
    { width: CONTENT_W }
  );

const steps = [
  {
    num: '01',
    title: 'SUBMIT YOUR ONLINE APPLICATION',
    time: '2–5 Working Days (Express 48h Free Zones Available)',
    desc: 'Complete our 3-step online setup calculator, submit your passport copy, and select up to 3 business activities. Your company name reservation, management screening, and compliance approval are processed digitally.',
  },
  {
    num: '02',
    title: 'PAY, E-SIGN & RECEIVE PROVISIONAL BANK LETTER',
    time: '2–3 Working Days',
    desc: 'Settle your transparent registration and licence fees, complete a brief remote video KYC verification, and e-sign your MOA. Receive your provisional approval and bank letter immediately to begin Wio or Mashreq onboarding. Flexi-desk licences are issued at this stage.',
  },
  {
    num: '03',
    title: 'RECEIVE E-LICENCE, EMIRATES ID & BANK ACCOUNT',
    time: '2–3 Working Days + 3-Day Visa Biometrics',
    desc: 'Your official electronic Trade Licence and Certificate of Incorporation are delivered digitally. If your package includes a UAE Residence Visa, visit Dubai for just 3 business days for VIP medical screening and Emirates ID fingerprinting.',
  },
];

let sy = 148;
steps.forEach((st) => {
  doc.roundedRect(48, sy, CONTENT_W, 145, 10).fill(COLORS.lightBg);
  doc.roundedRect(64, sy + 20, 44, 44, 10).fill(COLORS.emerald);
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.white)
    .text(st.num, 64, sy + 33, { width: 44, align: 'center' });

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.navy)
    .text(st.title, 124, sy + 20, { width: CONTENT_W - 92 });
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.blue)
    .text(st.time, 124, sy + 40, { width: CONTENT_W - 92 });
  doc
    .font('Helvetica')
    .fontSize(9.8)
    .fillColor(COLORS.slate)
    .text(st.desc, 124, sy + 60, { width: CONTENT_W - 92, lineGap: 3.5 });

  sy += 165;
});

drawFooterBar();

// ============================================================================
// PAGE 10: DISCLAIMER & DIRECT WHATSAPP DESK
// ============================================================================
doc.addPage();
doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.darkNavy);

drawLogoBadge(48, 52);

doc
  .font('Helvetica-Bold')
  .fontSize(11)
  .fillColor(COLORS.emerald)
  .text('VENTUREZONEUAE.COM', 48, 116);

doc
  .font('Helvetica-Bold')
  .fontSize(22)
  .fillColor(COLORS.white)
  .text('DISCLAIMER & ADVISORY NOTICE', 48, 134);

const disclaimers = [
  'The information and pricing proposals contained in this Company Profile are provided by venturezoneuae.com for informational and business planning purposes and do not constitute formal legal, tax, financial, or investment advice.',
  'Category rates shown reflect our revised lowest-price formation schedules starting from AED 5,000 across all UAE Free Zone authorities and Dubai Mainland. Official UAE government authority fees, external regulatory approvals (e.g., VARA, Central Bank, DET), and 5% UAE VAT (where applicable) remain subject to issuing authority regulations.',
  'Corporate banking onboarding timelines depend on individual shareholder KYC verification, nationality risk classification, and bank compliance review. venturezoneuae.com prepares and pre-vets documentation for Wio Business, Mashreq NeoBiz, RAKBANK, and other UAE partners.',
  'It remains the sole responsibility of the applicant to verify applicable regulatory requirements and supply authentic incorporation documentation.',
];

let dy = 178;
disclaimers.forEach((p) => {
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#CBD5E1')
    .text(p, 48, dy, { width: CONTENT_W, lineGap: 4 });
  dy += 72;
});

doc.roundedRect(48, 510, CONTENT_W, 165, 12).fill('#141923');
doc.roundedRect(48, 510, CONTENT_W, 165, 12).lineWidth(1).strokeColor(COLORS.emerald).stroke();

doc
  .font('Helvetica-Bold')
  .fontSize(16)
  .fillColor(COLORS.white)
  .text('Ready to Launch Your Dubai Company?', 72, 536);

doc
  .font('Helvetica')
  .fontSize(10.5)
  .fillColor('#CBD5E1')
  .text(
    'Lock in our lowest market pricing starting from AED 5,000 today via our online cost calculator or contact our formation specialists directly by email.',
    72,
    566,
    { width: CONTENT_W - 48, lineGap: 4 }
  );

doc
  .font('Helvetica-Bold')
  .fontSize(12)
  .fillColor(COLORS.emerald)
  .text('Email Us: info@venturezoneuae.com', 72, 616);
doc
  .font('Helvetica-Bold')
  .fontSize(11)
  .fillColor('#5EEAD4')
  .text('Website: https://venturezoneuae.com', 72, 638);

doc.end();

stream.on('finish', () => {
  console.log('Generated booklet at:', outPath);
});
