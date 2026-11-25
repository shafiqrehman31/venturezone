import { useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Loader2,
  Mail,
  MessageCircle,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';
import { COUNTRY_CODES, detectDefaultCountryCode } from '../data/defaults';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import { safeReadJson } from '../lib/safeJson';
import type {
  CmsLandingConfig,
  ContactEmailStatus,
  ContactJurisdiction,
} from '../types/domain';

interface ContactPageProps {
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  onStartQuote: (jurisdiction: 'Free Zone' | 'Mainland', visaCount: number) => void;
}

const SERVICE_OPTIONS = [
  '0-Visa UAE Free Zone License (AED 5,999 — Gov AED 5,200 + Service AED 799)',
  '1-Visa Free Zone All-Inclusive (AED 10,500 — Gov AED 8,750 + Service AED 1,750)',
  'Dubai Mainland Instant Setup DET (AED 10,999 — Gov AED 9,199 + Service AED 1,800)',
  'Corporate Bank KYC Pre-Vetting & Onboarding Coordination',
  'Flexi Desk / Office & Multi-Visa Packages',
];

interface ProposalPreviewState {
  inquiryId: string;
  toEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  attachmentName: string;
  emailStatus: ContactEmailStatus;
  emailNote: string;
}

export function ContactPage({ cms, onStartQuote }: ContactPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState(() => detectDefaultCountryCode());
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [jurisdiction, setJurisdiction] = useState<ContactJurisdiction>('All UAE Free Zones');
  const [serviceInterest, setServiceInterest] = useState(SERVICE_OPTIONS[0]);
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<ProposalPreviewState | null>(null);

  const rawSite = cms.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;
  const cleanWaDigits = cms.whatsappNumber.replace(/[^\d]/g, '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const cleanedPhone = whatsappNumber.replace(/[^\d]/g, '');

    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address so we can send your proposal.');
      return;
    }
    if (cleanedPhone.length < 6 || cleanedPhone.length > 15) {
      setErrorMsg('Please enter a valid WhatsApp number (6–15 digits).');
      return;
    }

    setSubmitting(true);
    const inquiryId = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let emailStatus: ContactEmailStatus = 'template_ready';
    let emailSubject = `Your UAE Business Setup Proposal & Company Profile — ${jurisdiction}`;
    let emailNote = 'Proposal template prepared with attached Company Profile PDF.';
    let templateBody = '';
    let attachmentName = 'venturezoneuae-company-profile.pdf';

    try {
      const emailRes = await fetch('/api/contact/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          countryCode,
          whatsappNumber: cleanedPhone,
          jurisdiction,
          serviceInterest,
          message: message.trim(),
        }),
      });
      const parsedEmail = await safeReadJson<{
        emailStatus?: ContactEmailStatus;
        emailNote?: string;
        template?: {
          subject: string;
          toEmail: string;
          recipientName: string;
          bodyText: string;
          attachmentName: string;
        };
      }>(emailRes);
      const json = parsedEmail.data;
      if (json?.emailStatus) {
        emailStatus = json.emailStatus;
      }
      if (json?.emailNote) {
        emailNote = json.emailNote;
      }
      if (json?.template) {
        emailSubject = json.template.subject;
        templateBody = json.template.bodyText;
        attachmentName = json.template.attachmentName;
      }
    } catch {
      emailStatus = 'template_ready';
    }

    const inquiryStatus = emailStatus === 'sent' ? 'Proposal Sent' : 'New';

    try {
      await setDoc(doc(db, 'contactInquiries', inquiryId), {
        id: inquiryId,
        fullName: trimmedName.slice(0, 120),
        email: trimmedEmail.slice(0, 200),
        countryCode: countryCode.slice(0, 8),
        whatsappNumber: cleanedPhone.slice(0, 32),
        jurisdiction,
        serviceInterest: serviceInterest.slice(0, 120),
        ...(message.trim() ? { message: message.trim().slice(0, 2000) } : {}),
        status: inquiryStatus,
        emailStatus,
        emailSubject: emailSubject.slice(0, 200),
        emailNote: emailNote.slice(0, 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setPreview({
        inquiryId,
        toEmail: trimmedEmail,
        recipientName: trimmedName,
        subject: emailSubject,
        bodyText: templateBody,
        attachmentName,
        emailStatus,
        emailNote,
      });

      setFullName('');
      setEmail('');
      setWhatsappNumber('');
      setMessage('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `contactInquiries/${inquiryId}`);
      } catch {
        setErrorMsg('Unable to submit your message right now. Please try again shortly.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Info Panel */}
        <div className="space-y-6 lg:col-span-5">
          <div className="spatial-glass rounded-3xl p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff0031]">
              Contact Our Advisory Desk
            </p>
            <h1
              className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#111827]"
              style={{ textWrap: 'balance' }}
            >
              Get Your Custom UAE Setup Proposal
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We incorporate companies across <strong>all UAE Free Zone authorities</strong> (RAKEZ,
              SHAMS, Ajman, Meydan, IFZA, DMCC &amp; more) and <strong>Dubai Mainland (DET)</strong>{' '}
              with lowest market pricing starting from{' '}
              <span className="font-mono font-bold text-[#ff0031]">
                AED {cms.zeroVisaPriceAed.toLocaleString()}
              </span>
              .
            </p>

            <div className="mt-6 space-y-4 border-t border-slate-200/80 pt-6 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff0031]/10 text-[#ff0031]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-[#111827]">Direct Proposal Email</div>
                  <div className="text-xs text-slate-600">info@venturezoneuae.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00b294]/15 text-[#008A72]">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-[#111827]">All UAE Jurisdictions Covered</div>
                  <div className="text-xs text-slate-600">
                    Remote incorporation · 48h digital license · 0% personal tax
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#111827]">
                  <Paperclip className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-[#111827]">Instant Proposal Email &amp; PDF</div>
                  <div className="text-xs text-slate-600">
                    Submitting prepares an email proposal to your inbox with our attached Company
                    Profile PDF.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-6">
              <a
                href={`https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
                  `Hello ${brandName}, I would like to discuss UAE company formation starting at AED ${cms.zeroVisaPriceAed.toLocaleString()}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#00b294] px-4 text-xs font-bold text-white transition-colors hover:bg-[#00967C]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Form / Confirmation Column */}
        <div className="lg:col-span-7">
          {preview ? (
            <div className="spatial-glass space-y-5 rounded-3xl p-7 sm:p-8">
              <div className="flex items-start gap-3 rounded-2xl border border-[#00b294]/35 bg-[#00b294]/[0.08] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#008A72]" />
                <div>
                  <div className="font-display text-base font-bold text-[#111827]">
                    Thank You, {preview.recipientName} — Inquiry Logged
                  </div>
                  <p className="mt-1 text-xs text-slate-700">{preview.emailNote}</p>
                </div>
              </div>

              {/* Proposal Email Preview Card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-[#FAFAFB] px-5 py-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-500">To:</span>{' '}
                      <span className="font-mono font-bold text-[#111827]">{preview.toEmail}</span>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        preview.emailStatus === 'sent'
                          ? 'bg-[#00b294]/15 text-[#008A72]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {preview.emailStatus === 'sent'
                        ? 'Email Sent with PDF'
                        : 'Proposal Email Ready'}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold text-slate-500">Subject:</span>{' '}
                    <span className="font-semibold text-[#111827]">{preview.subject}</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#ff0031]">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attached: {preview.attachmentName}</span>
                  </div>
                </div>

                {preview.bodyText && (
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap p-5 font-sans text-xs leading-relaxed text-slate-700">
                    {preview.bodyText}
                  </pre>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onStartQuote('Free Zone', 1)}
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-[#111827] hover:border-[#00b294]"
                >
                  <span>Open Cost Calculator</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="text-xs font-semibold text-slate-600 underline hover:text-[#111827]"
                >
                  Send another inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="spatial-glass space-y-4 rounded-3xl p-7 sm:p-8">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111827]">
                  Request Company Profile &amp; Custom Quote
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Your details go straight to our advisor desk and prepare your personalized
                  email proposal with our Company Profile PDF attached.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tariq Mahmood"
                    className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-[#1E293B] focus:border-[#ff0031] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                    Email Address (Proposal &amp; PDF Recipient)
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-[#1E293B] focus:border-[#ff0031] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-phone" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  WhatsApp Number
                </label>
                <div className="flex gap-2">
                  <select
                    aria-label="Country dial code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="min-h-[46px] w-32 shrink-0 rounded-xl border border-slate-300 bg-white px-2.5 font-mono text-xs text-[#1E293B] focus:border-[#ff0031] focus:outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="contact-phone"
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="50 482 9100"
                    className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm text-[#1E293B] focus:border-[#ff0031] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1E293B]">
                  Preferred Jurisdiction
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(['All UAE Free Zones', 'Dubai Mainland (DET)', 'Need Advice'] as ContactJurisdiction[]).map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setJurisdiction(opt)}
                        className={`min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition-colors ${
                          jurisdiction === opt
                            ? 'border-[#111827] bg-[#111827] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="contact-service" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  Service / Package Interest
                </label>
                <select
                  id="contact-service"
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value)}
                  className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-[#1E293B] focus:border-[#ff0031] focus:outline-none"
                >
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                  Business Activity &amp; Questions (Optional)
                </label>
                <textarea
                  id="contact-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your target activity, number of visas, or preferred UAE Free Zone..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-[#1E293B] focus:border-[#ff0031] focus:outline-none"
                />
              </div>

              {errorMsg && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#ff0031] px-5 text-sm font-bold text-white transition-colors hover:bg-[#D90029] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Inquiry &amp; Preparing Email Proposal...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Send Inquiry &amp; Receive Proposal PDF</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#00b294]" />
                <span>
                  Covers all UAE Free Zone authorities &amp; Dubai Mainland · Zero hidden fees
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
