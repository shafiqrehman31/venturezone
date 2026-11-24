export interface WhatsAppReplyContext {
  brandName?: string;
  zeroVisaPriceAed?: number;
  oneVisaPriceAed?: number;
  mainlandPriceAed?: number;
}

export function buildWhatsAppFallbackReply(
  userQuestion: string,
  context: WhatsAppReplyContext = {}
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
    q.includes('account')
  ) {
    return [
      `At ${brandName}, we coordinate KYC pre-vetting and onboarding with Wio Business (typically 3-5 working days), Mashreq NeoBiz, RAKBANK, and Emirates NBD.`,
      `Final account approval always rests with the bank's independent compliance/KYC team, so we prepare your activity profile, UBO docs, and source-of-funds file before submission.`,
      `Tap "Request WhatsApp Callback" above if you'd like an advisor to review your passport & business activity for banking readiness.`,
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
      `Quick UAE Jurisdiction Comparison:`,
      `- Free Zone (from AED ${zeroPrice} 0-Visa / AED ${onePrice} 1-Visa): Best for remote founders, e-commerce, software, and international consulting with 100% remote setup in 48 hours.`,
      `- Dubai Mainland DET (AED ${mainlandPrice} with 1 Visa): Best if you want to invoice UAE mainland clients directly, open a physical Dubai shop/office, or bid on government tenders.`,
      `We cover all UAE Free Zone authorities (RAKEZ, SHAMS, Ajman, Meydan, IFZA, DMCC & more) plus DET Mainland. Tap "Request WhatsApp Callback" for a tailored activity match.`,
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
      `Your UAE Free Zone e-license can be issued 100% remotely within 48 hours of submitting your passport copy and preferred company names.`,
      `If you choose a 1-Visa package (AED ${onePrice}), you only need to visit Dubai once for a quick 3-day biometrics and VIP medical appointment for your Emirates ID.`,
      `You can also download our step-by-step guide anytime at /company-profile.pdf or lock your quote using "Request WhatsApp Callback".`,
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
      `Our lowest workspace & office rates across UAE Free Zones:`,
      `- Flexi Desks AED 5,000/yr | Co-Working AED 8,500/yr | Serviced Desks AED 12,000/yr | Serviced Offices AED 18,000/yr.`,
      `- Premium Towers: J&G Fitted AED 19,000/yr | Silver Tower AED 28,000/yr | Detached AED 28,000/yr | Almas Tower AED 45,000/yr.`,
      `Permits start from AED 950 (Office Sharing) and AED 2,500 (Dual Licence). Tap "Request WhatsApp Callback" for availability.`,
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
      `Our transparent ${brandName} packages (Authority/Gov fees separated from Venture Zone service fees):`,
      `- 0-Visa Free Zone License: AED ${zeroPrice} (Gov AED 5,200 + Service AED 799)`,
      `- 1-Visa Free Zone All-Inclusive: AED ${onePrice} (Gov AED 8,750 + Service AED 1,750 — includes Visa, EID, Medical & Bank KYC prep)`,
      `- Dubai Mainland DET Setup: AED ${mainlandPrice} (Gov AED 9,199 + Service AED 1,800 — includes 1 Visa & full UAE market access)`,
      `Tap "Request WhatsApp Callback" above to lock your custom quote in 15 seconds.`,
    ].join('\n\n');
  }

  return [
    `Thanks for reaching out to ${brandName}! Here are our transparent starting packages across all UAE Free Zones & Dubai Mainland:`,
    `- 0-Visa Free Zone License: AED ${zeroPrice} (48h remote setup)`,
    `- 1-Visa Free Zone Package: AED ${onePrice} (includes 2-year Investor Visa & EID)`,
    `- Dubai Mainland DET Package: AED ${mainlandPrice} (full UAE market access + 1 Visa)`,
    `Ask me about Free Zone vs. Mainland, corporate banking, or tap "Request WhatsApp Callback" to speak with an advisor.`,
  ].join('\n\n');
}
