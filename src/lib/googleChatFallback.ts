export interface GoogleChatContext {
  brandName?: string;
  zeroVisaPriceAed?: number;
  oneVisaPriceAed?: number;
  mainlandPriceAed?: number;
}

export function buildGoogleBotFallbackReply(
  userQuestion: string,
  context: GoogleChatContext = {}
): string {
  const brandName = context.brandName?.trim() || 'venturezoneuae.com';
  const zeroPrice = Number(context.zeroVisaPriceAed || 5999).toLocaleString();
  const onePrice = Number(context.oneVisaPriceAed || 10500).toLocaleString();
  const mainlandPrice = Number(context.mainlandPriceAed || 10999).toLocaleString();
  const q = userQuestion.toLowerCase();

  if (
    q.includes('bank') ||
    q.includes('wio') ||
    q.includes('mashreq') ||
    q.includes('rakbank') ||
    q.includes('enbd') ||
    q.includes('account')
  ) {
    return [
      `Corporate Banking with ${brandName}:`,
      `We coordinate KYC pre-vetting and onboarding with Wio Business (typically 3-5 working days), Mashreq NeoBiz, RAKBANK, and Emirates NBD.`,
      `Final account approval always rests with each bank's independent compliance/KYC team, so we prepare your activity profile, UBO structure, and source-of-funds documents before submission.`,
      `Tap "Request Callback" above if you'd like an advisor to pre-check your passport & business activity for banking readiness.`,
    ].join('\n\n');
  }

  if (
    q.includes('tax') ||
    q.includes('vat') ||
    q.includes('corporate tax') ||
    q.includes('renewal') ||
    q.includes('year 2') ||
    q.includes('hidden')
  ) {
    return [
      `UAE Tax & Year 2 Renewal Clarity:`,
      `- 0% personal income tax and 0% corporate tax on qualifying Free Zone income (or Mainland net profits up to AED 375,000; 9% above AED 375,000).`,
      `- VAT registration (5%) is mandatory only once annual taxable turnover exceeds AED 375,000.`,
      `- Year 2 license renewals typically match official Authority fees (~AED 5,200-6,200 for 0-Visa Free Zone, ~AED 7,500-9,500 with visa allocation) with zero hidden surprise surcharges.`,
    ].join('\n\n');
  }

  if (
    q.includes('document') ||
    q.includes('passport') ||
    q.includes('need') ||
    q.includes('require') ||
    q.includes('kyc')
  ) {
    return [
      `Documents Needed to Start (100% Digital):`,
      `- Clear color passport copy (valid 6+ months) for each shareholder.`,
      `- High-res passport-style photo (white background) and 3 proposed company trade names.`,
      `- Current residential address, email, and phone number.`,
      `That is all we need to issue your UAE e-license within 48 hours. Tap "Request Callback" above to lock your quote.`,
    ].join('\n\n');
  }

  if (
    q.includes('mainland') ||
    q.includes('det') ||
    q.includes('free zone') ||
    q.includes('freezone') ||
    q.includes('vs') ||
    q.includes('compare')
  ) {
    return [
      `UAE Jurisdiction Comparison:`,
      `- UAE Free Zone (AED ${zeroPrice} 0-Visa / AED ${onePrice} 1-Visa): Ideal for remote founders, e-commerce, software, and international consulting with 100% remote setup in 48 hours.`,
      `- Dubai Mainland DET (AED ${mainlandPrice} with 1 Visa): Best if you want to invoice UAE mainland clients directly, open a Dubai physical shop/office, or bid on government contracts.`,
      `We cover all UAE Free Zone authorities (RAKEZ, SHAMS, Ajman, Meydan, IFZA, DMCC & more) plus DET Mainland. Tap "Request Callback" for an exact activity match.`,
    ].join('\n\n');
  }

  if (
    q.includes('48') ||
    q.includes('fast') ||
    q.includes('time') ||
    q.includes('long') ||
    q.includes('process') ||
    q.includes('remote') ||
    q.includes('visit')
  ) {
    return [
      `Our Simple 48-Hour Setup Process:`,
      `1. Activity & Authority Match: Pick your business activity and Free Zone or Mainland jurisdiction.`,
      `2. Digital KYC & Submission: Upload your passport copy—we handle all name reservation and authority filings.`,
      `3. E-License in 48 Hours: Receive your Trade License, COI & MOA digitally from anywhere in the world.`,
      `4. Visa & Banking (Optional): One 3-day Dubai visit for biometrics/Emirates ID + Wio/Mashreq bank coordination.`,
    ].join('\n\n');
  }

  if (
    q.includes('office') ||
    q.includes('desk') ||
    q.includes('workspace') ||
    q.includes('permit') ||
    q.includes('almas') ||
    q.includes('silver')
  ) {
    return [
      `Workspace, Office & Permit Lowest Rates:`,
      `- Flexi Desks AED 5,000/yr | Co-Working AED 8,500/yr | Serviced Desks AED 12,000/yr | Serviced Offices AED 18,000/yr.`,
      `- Premium Offices: J&G Fitted AED 19,000/yr | Silver Tower AED 28,000/yr | Detached AED 28,000/yr | Almas Tower AED 45,000/yr.`,
      `- Permits & Visas: Office Sharing AED 950 | Dual Licence AED 2,500 | 1-Yr Visa AED 950 | 2-Yr Standard Visa AED 1,450.`,
    ].join('\n\n');
  }

  if (
    q.includes('price') ||
    q.includes('cost') ||
    q.includes('aed') ||
    q.includes('visa') ||
    q.includes('package') ||
    q.includes('5999') ||
    q.includes('10500') ||
    q.includes('10999')
  ) {
    return [
      `Transparent ${brandName} Packages (Authority/Gov fees separated from Service fees):`,
      `- 0-Visa Free Zone License: AED ${zeroPrice} (Gov AED 5,200 + Service AED 799)`,
      `- 1-Visa Free Zone All-Inclusive: AED ${onePrice} (Gov AED 8,750 + Service AED 1,750 — includes 2-Yr Visa, Emirates ID, Medical & Bank KYC prep)`,
      `- Dubai Mainland DET Setup: AED ${mainlandPrice} (Gov AED 9,199 + Service AED 1,800 — includes 1 Visa & full UAE market access)`,
      `Tap "Request Callback" above to lock your itemized quote in 15 seconds.`,
    ].join('\n\n');
  }

  return [
    `Hi! I'm Zoya, your ${brandName} UAE Business Setup Specialist. Here are our transparent starting packages across all UAE Free Zones & Dubai Mainland:`,
    `- 0-Visa Free Zone License: AED ${zeroPrice} (48h remote setup)`,
    `- 1-Visa Free Zone Package: AED ${onePrice} (includes 2-year Investor Visa & Emirates ID)`,
    `- Dubai Mainland DET Package: AED ${mainlandPrice} (full UAE market access + 1 Visa)`,
    `Ask me about Free Zone vs. Mainland, corporate banking, documents, taxes, or tap "Request Advisor Callback" above for a custom advisor quote.`,
  ].join('\n\n');
}
