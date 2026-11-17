import { ArrowLeft, ArrowRight, FileCheck2, Scale, Shield } from 'lucide-react';
import type { CmsLandingConfig, JurisdictionType } from '../types/domain';

export type LegalSlug =
  | 'privacy-policy'
  | 'terms-of-service'
  | 'refund-policy'
  | 'legal-disclaimer';

export const LEGAL_PAGE_LINKS: { slug: LegalSlug; label: string }[] = [
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'terms-of-service', label: 'Terms of Service' },
  { slug: 'refund-policy', label: 'Refund Policy' },
  { slug: 'legal-disclaimer', label: 'Legal Disclaimer' },
];

export function isLegalSlug(slug: string): slug is LegalSlug {
  return LEGAL_PAGE_LINKS.some((p) => p.slug === slug);
}

interface LegalPageViewProps {
  slug: LegalSlug;
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  onNavigate: (slug: string) => void;
  onStartQuote: (jurisdiction: JurisdictionType, visaCount: number) => void;
}

export function LegalPageView({
  slug,
  cms,
  onNavigate,
  onStartQuote,
}: LegalPageViewProps) {
  const rawSite = cms.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;
  const legalEntityName = `${brandName} Corporate Services LLC`;

  const contentMap: Record<
    LegalSlug,
    {
      title: string;
      subtitle: string;
      effectiveDate: string;
      sections: { heading: string; paragraphs: string[] }[];
    }
  > = {
    'privacy-policy': {
      title: 'Privacy Policy',
      subtitle: `How ${brandName} collects, safeguards, and processes founder inquiry and company formation records.`,
      effectiveDate: 'November 2026',
      sections: [
        {
          heading: '1. Data Controller & Scope',
          paragraphs: [
            `This Privacy Policy explains how ${brandName} (${legalEntityName}), operating in Dubai, United Arab Emirates, collects and processes personal data when you submit a company setup cost calculation, consultation request, or tracking lookup through our website.`,
          ],
        },
        {
          heading: '2. Information We Collect',
          paragraphs: [
            `When you request an incorporation breakdown or advisor callback via ${brandName}, we collect your full name, WhatsApp/phone number with country dial code, optional work email address, selected UAE jurisdiction (Free Zone or Mainland), preferred business activity, and visa allocation count.`,
            `Each quote generates a non-personal reference code (MRD format) used exclusively by our live formation progress tracker so you can monitor licensing milestones without exposing personal contact details publicly.`,
          ],
        },
        {
          heading: '3. Purpose of Processing & CRM Integration',
          paragraphs: [
            `Your inquiry data is used strictly to prepare your itemized AED formation quotation, conduct initial UAE Free Zone or Dubai Economy & Tourism (DET) activity eligibility checks, pre-screen corporate bank account readiness, and sync your lead file with our internal CRM desk so a dedicated formation specialist can contact you.`,
            `${brandName} never sells, rents, or distributes founder contact records to unrelated third-party brokers.`,
          ],
        },
        {
          heading: '4. Data Retention, Security & Founder Rights',
          paragraphs: [
            `Customer lead and KYC records are stored under role-restricted cloud database controls accessible only to authorized ${brandName} operations personnel. Under UAE Federal Decree-Law No. 45 of 2021 (PDPL), you may request access, correction, or deletion of your inquiry data at any time by messaging our compliance desk via WhatsApp.`,
          ],
        },
      ],
    },
    'terms-of-service': {
      title: 'Terms of Service',
      subtitle: `Governing terms for company registration advisory, cost estimates, and PRO services provided by ${brandName}.`,
      effectiveDate: 'November 2026',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          paragraphs: [
            `By accessing the ${brandName} website, using the Interactive Setup Cost Calculator, or engaging ${legalEntityName} for UAE business registration, you agree to be bound by these Terms of Service and applicable laws of the Emirate of Dubai and the United Arab Emirates.`,
          ],
        },
        {
          heading: '2. Scope of Corporate Formation Services',
          paragraphs: [
            `${brandName} provides corporate structuring advisory, trade name reservation support, electronic Memorandum of Association (MOA) coordination, UAE Free Zone and Mainland license filing, Emirates ID / medical typing scheduling, and corporate bank pre-vetting introductions.`,
            `Final issuance of trade licenses, establishment cards, residence visas, and corporate bank accounts remains subject to approval by the relevant UAE government authority, immigration department, and financial institution.`,
          ],
        },
        {
          heading: '3. Pricing Transparency & Government Fees',
          paragraphs: [
            `All quotes generated on ${brandName} itemize government license fees, establishment card charges, visa allocations, and medical/Emirates ID fees in United Arab Emirates Dirhams (AED). Official government fee adjustments enacted by UAE authorities prior to submission will be communicated transparently in writing before payment.`,
          ],
        },
        {
          heading: '4. Client Compliance Obligations',
          paragraphs: [
            `Founders must provide accurate, authentic passport scans, residential details, and source-of-funds disclosures required under UAE Anti-Money Laundering (AML) and Know Your Customer (KYC) regulations. ${brandName} reserves the right to decline or suspend applications involving inaccurate documentation or restricted activities.`,
          ],
        },
      ],
    },
    'refund-policy': {
      title: 'Refund & Cancellation Policy',
      subtitle: `Clear rules distinguishing government authority disbursements from ${brandName} advisory fees.`,
      effectiveDate: 'November 2026',
      sections: [
        {
          heading: '1. Government & Authority Fees',
          paragraphs: [
            `Fees paid directly to UAE government entities—including Dubai Economy & Tourism (DET), Meydan Free Zone, IFZA, RAKEZ, DMCC, Federal Authority for Identity & Citizenship (ICP), or Dubai Health Authority (DHA)—are strictly non-refundable once an application or trade name reservation has been submitted to the authority portal.`,
          ],
        },
        {
          heading: '2. Advisory & PRO Service Retainers',
          paragraphs: [
            `If you cancel your formation request in writing before ${brandName} submits your trade name reservation or compliance file to any UAE government authority, 100% of unused government disbursements and unallocated ${brandName} advisory fees (less a standard administrative compliance review fee where work has commenced) will be refunded within 10 business days.`,
          ],
        },
        {
          heading: '3. Security Clearance or Bank Declines',
          paragraphs: [
            `In the rare event a Free Zone or Mainland authority declines initial security clearance prior to license issuance, ${brandName} will assist with an alternative UAE jurisdiction re-filing at zero additional advisory fee or process any authority-approved fee refund in accordance with the issuing registry's rules.`,
          ],
        },
      ],
    },
    'legal-disclaimer': {
      title: 'Legal & Regulatory Disclaimer',
      subtitle: `Important disclosures regarding ${brandName}'s independent advisory role and UAE regulatory standards.`,
      effectiveDate: 'November 2026',
      sections: [
        {
          heading: '1. Independent Corporate Services Provider',
          paragraphs: [
            `${brandName} (${legalEntityName}) is a private corporate services and business setup consultancy operating in Dubai, UAE. ${brandName} is not a UAE government agency, federal ministry, or licensed financial institution, though we coordinate filings with authorized UAE Free Zone and Mainland registration portals.`,
          ],
        },
        {
          heading: '2. Informative Estimates & Tax Guidance',
          paragraphs: [
            `Cost breakdowns, 48-hour e-license timelines, and references to UAE 0% personal income tax or corporate tax thresholds published on ${brandName} are provided for general business planning purposes. Final tax treatment depends on your entity structure, qualifying Free Zone status, and official Federal Tax Authority (FTA) determinations.`,
          ],
        },
        {
          heading: '3. Corporate Banking Timelines',
          paragraphs: [
            `Bank account opening timelines (typically 3–5 business days with digital partners such as Wio Business or Mashreq NeoBiz) depend on individual shareholder nationality, business activity risk classification, and bank compliance verification. ${brandName} provides pre-vetting and direct introductions but cannot guarantee unilateral bank approval.`,
          ],
        },
      ],
    },
  };

  const docData = contentMap[slug];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Sidebar Navigation */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="spatial-glass rounded-2xl p-5">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff0031] hover:text-[#D90029]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to {brandName} Home</span>
            </button>

            <div className="mt-4 flex items-center gap-2 text-[#111827]">
              <Scale className="h-4 w-4 text-[#00b294]" />
              <h2 className="font-display text-sm font-bold">Legal &amp; Compliance Documents</h2>
            </div>

            <nav className="mt-3 space-y-1.5" aria-label="Legal pages">
              {LEGAL_PAGE_LINKS.map((item) => {
                const active = item.slug === slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => onNavigate(item.slug)}
                    className={`flex min-h-[42px] w-full items-center justify-between rounded-xl px-3.5 text-left text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#ff0031] text-white'
                        : 'text-slate-600 hover:bg-white/90 hover:text-[#111827]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <FileCheck2 className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="spatial-glass-soft rounded-2xl p-5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-[#111827]">
              <Shield className="h-4 w-4 text-[#00b294]" />
              <span>Compliance Desk</span>
            </div>
            <p className="mt-2 leading-relaxed">
              Entity: <strong className="text-[#111827]">{legalEntityName}</strong>
              <br />
              Jurisdiction: United Arab Emirates
              <br />
              Support:{' '}
              <a
                href={`https://wa.me/${cms.whatsappNumber.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#008A72] hover:underline"
              >
                WhatsApp Advisory Desk
              </a>
            </p>
          </div>
        </aside>

        {/* Right Legal Document Content */}
        <article className="spatial-glass rounded-3xl p-7 sm:p-10 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-5">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#ff0031]">
                {brandName} · Legal Documentation
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#111827]">
                {docData.title}
              </h1>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-500">
              Updated {docData.effectiveDate}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            {docData.subtitle}
          </p>

          <div className="mt-8 space-y-7">
            {docData.sections.map((section) => (
              <section key={section.heading} className="space-y-2.5">
                <h2 className="font-display text-lg font-bold text-[#111827]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-slate-700">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6">
            <p className="text-xs text-slate-500">
              Questions regarding these terms? Speak directly with our Dubai compliance desk.
            </p>
            <button
              type="button"
              onClick={() => onStartQuote('Free Zone', 1)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#ff0031] px-4 text-xs font-bold text-white transition-colors hover:bg-[#D90029]"
            >
              <span>Calculate My Setup Cost</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
