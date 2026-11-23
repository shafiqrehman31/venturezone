import { useState } from 'react';
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Mail,
  Paperclip,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import type {
  ContactEmailStatus,
  ContactInquiry,
  ContactInquiryStatus,
} from '../types/domain';

interface AdminContactTabProps {
  inquiries: ContactInquiry[];
}

const INQUIRY_STATUS_OPTIONS: ContactInquiryStatus[] = [
  'New',
  'Proposal Sent',
  'Contacted',
  'Closed',
];

function buildEmailBodyText(inq: ContactInquiry): string {
  const fullPhone = `${inq.countryCode} ${inq.whatsappNumber}`.trim();
  return [
    `Dear ${inq.fullName},`,
    ``,
    `Thank you for contacting venturezoneuae.com regarding ${inq.serviceInterest} (${inq.jurisdiction}).`,
    ``,
    `Attached to this email is our Company Profile & Transparent Pricing Proposal (venturezoneuae-company-profile.pdf), covering all UAE Free Zone authorities and Dubai Mainland (DET) with itemized Authority Fees vs. Venture Zone Service Fees:`,
    ``,
    `- 0-Visa UAE Free Zone License: AED 5,999 (Authority/Gov AED 5,200 + Venture Zone Service AED 799)`,
    `- 1-Visa Free Zone (All-Inclusive): AED 10,500 (Authority/Gov AED 8,750 + Venture Zone Service AED 1,750)`,
    `- Dubai Mainland Instant Setup (DET): AED 10,999 (Authority/Gov AED 9,199 + Venture Zone Service AED 1,800)`,
    ``,
    `Your Submitted Request Summary:`,
    `- Name: ${inq.fullName}`,
    `- Email: ${inq.email}`,
    `- WhatsApp: ${fullPhone}`,
    `- Jurisdiction: ${inq.jurisdiction}`,
    `- Service Interest: ${inq.serviceInterest}`,
    ...(inq.message ? [`- Notes: ${inq.message}`] : []),
    ``,
    `A senior UAE corporate formation advisor will review your preferred activity and reach out shortly with tailored authority recommendations.`,
    ``,
    `Best regards,`,
    `Venture Zone Corporate Advisory Desk`,
    `Email: info@venturezoneuae.com`,
    `Web: https://venturezoneuae.com`,
  ].join('\n');
}

export function AdminContactTab({ inquiries }: AdminContactTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [downloadingEmlId, setDownloadingEmlId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const filtered = inquiries.filter((inq) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inq.fullName.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      inq.whatsappNumber.includes(q) ||
      inq.serviceInterest.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleStatusChange(inq: ContactInquiry, nextStatus: ContactInquiryStatus) {
    try {
      await updateDoc(doc(db, 'contactInquiries', inq.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contactInquiries/${inq.id}`);
    }
  }

  async function handleSendProposalEmail(inq: ContactInquiry) {
    setSendingEmailId(inq.id);
    setFeedbackBanner(null);
    try {
      const res = await fetch('/api/contact/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inq.fullName,
          email: inq.email,
          countryCode: inq.countryCode,
          whatsappNumber: inq.whatsappNumber,
          jurisdiction: inq.jurisdiction,
          serviceInterest: inq.serviceInterest,
          message: inq.message || '',
        }),
      });
      const json = (await res.json()) as {
        emailStatus?: ContactEmailStatus;
        emailNote?: string;
        template?: { subject: string };
      };

      const nextEmailStatus: ContactEmailStatus = json.emailStatus || 'template_ready';
      const nextNote = json.emailNote || 'Proposal template prepared.';
      const nextSubject =
        json.template?.subject ||
        inq.emailSubject ||
        `Your UAE Business Setup Proposal & Company Profile — ${inq.jurisdiction}`;

      await updateDoc(doc(db, 'contactInquiries', inq.id), {
        emailStatus: nextEmailStatus,
        emailSubject: nextSubject.slice(0, 200),
        emailNote: nextNote.slice(0, 300),
        ...(nextEmailStatus === 'sent' ? { status: 'Proposal Sent' } : {}),
        updatedAt: serverTimestamp(),
      });

      if (selectedInquiry?.id === inq.id) {
        setSelectedInquiry({
          ...inq,
          emailStatus: nextEmailStatus,
          emailNote: nextNote,
          emailSubject: nextSubject,
          status: nextEmailStatus === 'sent' ? 'Proposal Sent' : inq.status,
        });
      }

      setFeedbackBanner({
        type: nextEmailStatus === 'sent' ? 'success' : nextEmailStatus === 'failed' ? 'error' : 'info',
        text:
          nextEmailStatus === 'template_ready'
            ? 'RESEND_API_KEY is not configured yet—use "Download .EML + Attached PDF" below to open and send directly from your email client.'
            : nextNote,
      });
    } catch {
      setFeedbackBanner({
        type: 'error',
        text: 'Unable to dispatch email right now. Use "Download .EML + Attached PDF" instead.',
      });
    } finally {
      setSendingEmailId(null);
    }
  }

  async function handleDownloadEml(inq: ContactInquiry) {
    setDownloadingEmlId(inq.id);
    try {
      const res = await fetch('/api/contact/proposal-eml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inq.fullName,
          email: inq.email,
          countryCode: inq.countryCode,
          whatsappNumber: inq.whatsappNumber,
          jurisdiction: inq.jurisdiction,
          serviceInterest: inq.serviceInterest,
          message: inq.message || '',
        }),
      });
      if (!res.ok) throw new Error('Unable to generate EML draft');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${inq.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.eml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } finally {
      setDownloadingEmlId(null);
    }
  }

  async function handleCopyEmailBody(inq: ContactInquiry) {
    const text = buildEmailBodyText(inq);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(inq.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'contactInquiries', id));
      setConfirmDeleteId(null);
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `contactInquiries/${id}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-base font-bold text-[#111827]">
            Contact Us Submissions &amp; Proposal Email Templates
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Every website inquiry saves here with a pre-addressed email template and attached{' '}
            <span className="font-mono font-semibold text-[#111827]">
              venturezoneuae-company-profile.pdf
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name or email..."
              className="min-h-[40px] rounded-lg border border-slate-300 bg-[#FAFAFB] pl-9 pr-3 text-xs focus:border-[#ff0031] focus:bg-white focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter contact inquiries by status"
            className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#111827]"
          >
            <option value="ALL">All Statuses ({inquiries.length})</option>
            {INQUIRY_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#FAFAFB] text-slate-500">
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Jurisdiction &amp; Interest</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Email Proposal</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No Contact Us inquiries match your filter yet. Submissions from the Contact Us
                    page appear here in real time.
                  </td>
                </tr>
              ) : (
                filtered.map((inq) => (
                  <tr key={inq.id} className="hover:bg-[#FAFAFB]">
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-bold text-[#111827]">{inq.fullName}</div>
                      <div className="font-mono text-[11px] text-[#008A72]">{inq.email}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {inq.countryCode} {inq.whatsappNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-[#111827]">{inq.jurisdiction}</div>
                      <div className="mt-0.5 max-w-[210px] text-[11px] text-slate-600">
                        {inq.serviceInterest}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="max-w-[220px] whitespace-pre-line text-[11px] text-slate-600">
                        {inq.message || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      {inq.emailStatus === 'sent' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#00b294]/15 px-2 py-1 font-semibold text-[#008A72]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Sent w/ PDF</span>
                        </span>
                      ) : inq.emailStatus === 'failed' ? (
                        <span className="inline-flex rounded-md bg-red-100 px-2 py-1 font-semibold text-red-700">
                          Send Failed
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                          Template Ready
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <select
                        value={inq.status}
                        aria-label={`Update status for ${inq.fullName}`}
                        onChange={(e) =>
                          handleStatusChange(inq, e.target.value as ContactInquiryStatus)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111827]"
                      >
                        {INQUIRY_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-right align-top">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackBanner(null);
                            setSelectedInquiry(inq);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#ff0031]"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email Template</span>
                        </button>

                        {confirmDeleteId === inq.id ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(inq.id)}
                            className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(inq.id)}
                            aria-label={`Delete inquiry from ${inq.fullName}`}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-200 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Template + Attached Proposal Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#111827] px-6 py-4 text-white">
              <div>
                <h3 className="font-display text-base font-bold">
                  Proposal Email Template With Attached Company Profile
                </h3>
                <p className="text-xs text-slate-300">
                  Addressed directly to {selectedInquiry.fullName} ({selectedInquiry.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                aria-label="Close email template modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs">
              {feedbackBanner && (
                <div
                  className={`rounded-xl border px-4 py-3 font-medium ${
                    feedbackBanner.type === 'success'
                      ? 'border-[#00b294]/40 bg-[#00b294]/10 text-[#008A72]'
                      : feedbackBanner.type === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  {feedbackBanner.text}
                </div>
              )}

              {/* Email Headers */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-[#FAFAFB] p-4">
                <div>
                  <span className="font-semibold text-slate-500">From:</span>{' '}
                  <span className="font-mono text-[#111827]">
                    Venture Zone UAE &lt;info@venturezoneuae.com&gt;
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">To:</span>{' '}
                  <span className="font-mono font-bold text-[#008A72]">
                    {selectedInquiry.fullName} &lt;{selectedInquiry.email}&gt;
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Subject:</span>{' '}
                  <span className="font-bold text-[#111827]">
                    {selectedInquiry.emailSubject ||
                      `Your UAE Business Setup Proposal & Company Profile — ${selectedInquiry.jurisdiction}`}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff0031]/30 bg-[#FFF5F7] px-3 py-1.5 text-[11px] font-bold text-[#ff0031]">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attachment: venturezoneuae-company-profile.pdf (Attached)</span>
                  </span>
                </div>
              </div>

              {/* Safe JSX Branded Email Preview */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b-4 border-[#ff0031] bg-[#111827] px-5 py-4 text-white">
                  <div className="font-display text-sm font-bold">venturezoneuae.com</div>
                  <div className="text-[11px] font-bold text-[#00b294]">
                    UAE COMPANY FORMATION PROPOSAL &amp; COMPANY PROFILE
                  </div>
                </div>
                <div className="space-y-3 p-5 text-slate-700">
                  <p className="font-bold text-[#111827]">Dear {selectedInquiry.fullName},</p>
                  <p className="leading-relaxed">
                    Thank you for contacting <strong>venturezoneuae.com</strong> regarding{' '}
                    <strong>{selectedInquiry.serviceInterest}</strong> ({selectedInquiry.jurisdiction}
                    ). Please find attached our official{' '}
                    <strong>Company Profile &amp; 2026 Pricing Proposal</strong> (
                    <span className="font-mono">venturezoneuae-company-profile.pdf</span>).
                  </p>

                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-[#FAFAFB]">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <div>0-Visa UAE Free Zone License</div>
                        <div className="text-[10px] text-slate-500">
                          Gov ~AED 5,200 + Service AED 799
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#ff0031]">AED 5,999</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <div>1-Visa Free Zone (All-Inclusive)</div>
                        <div className="text-[10px] text-slate-500">
                          Gov ~AED 8,750 + Service AED 1,750
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#ff0031]">AED 10,500</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <div>Dubai Mainland Instant Setup (DET)</div>
                        <div className="text-[10px] text-slate-500">
                          Gov ~AED 9,199 + Service AED 1,800
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#ff0031]">AED 10,999</span>
                    </div>
                  </div>

                  <div className="rounded-lg border-l-4 border-[#00b294] bg-[#00b294]/[0.06] p-3 text-[#111827]">
                    <div className="font-bold">Submitted Request Summary</div>
                    <div>Email: {selectedInquiry.email}</div>
                    <div>
                      WhatsApp: {selectedInquiry.countryCode} {selectedInquiry.whatsappNumber}
                    </div>
                    <div>Jurisdiction: {selectedInquiry.jurisdiction}</div>
                    <div>Service: {selectedInquiry.serviceInterest}</div>
                    {selectedInquiry.message && <div>Notes: {selectedInquiry.message}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-[#FAFAFB] px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={sendingEmailId === selectedInquiry.id}
                  onClick={() => handleSendProposalEmail(selectedInquiry)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029] disabled:opacity-60"
                >
                  {sendingEmailId === selectedInquiry.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Send Proposal Email</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingEmlId === selectedInquiry.id}
                  onClick={() => handleDownloadEml(selectedInquiry)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#00b294] px-4 text-xs font-bold text-white hover:bg-[#00967C] disabled:opacity-60"
                >
                  {downloadingEmlId === selectedInquiry.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Download .EML + Attached PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyEmailBody(selectedInquiry)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#111827] hover:border-[#00b294]"
                >
                  {copiedId === selectedInquiry.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#008A72]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="text-xs font-semibold text-slate-600 hover:text-[#111827]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
