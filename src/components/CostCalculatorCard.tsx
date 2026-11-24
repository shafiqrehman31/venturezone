import { useEffect, useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Globe2,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  BUSINESS_ACTIVITIES,
  COUNTRY_CODES,
  calculateSetupBreakdown,
  detectDefaultCountryCode,
} from '../data/defaults';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import { safeReadJson } from '../lib/safeJson';
import type { CmsLandingConfig, JurisdictionType } from '../types/domain';

interface CostCalculatorCardProps {
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  selectedPreset?: { jurisdiction: JurisdictionType; visaCount: number; tick: number } | null;
  onQuoteCreated?: (trackingCode: string) => void;
}

function generateTrackingCode(): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `MRD-${digits}-${random}`;
}

export function CostCalculatorCard({
  cms,
  selectedPreset,
  onQuoteCreated,
}: CostCalculatorCardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jurisdiction, setJurisdiction] = useState<JurisdictionType>('Free Zone');
  const [businessActivity, setBusinessActivity] = useState<string>(BUSINESS_ACTIVITIES[1]);
  const [visaCount, setVisaCount] = useState<number>(1);

  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unlockedTrackingCode, setUnlockedTrackingCode] = useState<string | null>(null);
  const [pipedriveNote, setPipedriveNote] = useState<string>('');

  useEffect(() => {
    setCountryCode(detectDefaultCountryCode());
  }, []);

  useEffect(() => {
    if (selectedPreset) {
      setJurisdiction(selectedPreset.jurisdiction);
      setVisaCount(selectedPreset.visaCount);
      setUnlockedTrackingCode(null);
      setStep(2);
    }
  }, [selectedPreset]);

  const breakdown = calculateSetupBreakdown(jurisdiction, visaCount, cms);
  const progressPercent = unlockedTrackingCode ? 100 : step === 1 ? 33 : step === 2 ? 66 : 100;

  async function handleUnlockQuote(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = fullName.trim();
    const cleanedPhone = whatsappNumber.replace(/[^\d]/g, '');

    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (cleanedPhone.length < 6 || cleanedPhone.length > 15) {
      setErrorMsg('Please enter a valid WhatsApp number (6–15 digits).');
      return;
    }

    setSubmitting(true);
    const trackingCode = generateTrackingCode();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let pipedriveSyncStatus: 'pending' | 'synced' | 'pending_config' | 'failed' = 'pending';
    let pipedriveDealId: string | undefined;
    let pipedrivePersonId: string | undefined;
    let pipedriveError: string | undefined;

    try {
      const syncRes = await fetch('/api/pipedrive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode,
          fullName: trimmedName,
          countryCode,
          whatsappNumber: cleanedPhone,
          email: email.trim() || undefined,
          jurisdiction,
          authority: breakdown.authority,
          businessActivity,
          visaCount,
          packageName: breakdown.packageName,
          estimatedTotalAed: breakdown.totalAed,
          source: 'Google Ads Calculator',
        }),
      });
      const parsedSync = await safeReadJson<{
        syncStatus?: 'synced' | 'pending_config' | 'failed';
        pipedriveDealId?: string;
        pipedrivePersonId?: string;
        error?: string;
        message?: string;
      }>(syncRes);
      const syncJson = parsedSync.data;
      if (syncJson?.syncStatus) {
        pipedriveSyncStatus = syncJson.syncStatus;
        pipedriveDealId = syncJson.pipedriveDealId;
        pipedrivePersonId = syncJson.pipedrivePersonId;
        pipedriveError = syncJson.error;
        if (syncJson.syncStatus === 'synced') {
          setPipedriveNote(`CRM Deal #${syncJson.pipedriveDealId} created`);
        } else if (syncJson.syncStatus === 'pending_config') {
          setPipedriveNote('Quote saved & queued for advisor callback');
        }
      }
    } catch {
      pipedriveSyncStatus = 'pending';
    }

    const batch = writeBatch(db);
    const orderRef = doc(db, 'orders', orderId);
    const statusRef = doc(db, 'orderStatus', trackingCode);

    const orderPayload: Record<string, unknown> = {
      trackingCode,
      fullName: trimmedName.slice(0, 120),
      countryCode: countryCode.slice(0, 8),
      whatsappNumber: cleanedPhone.slice(0, 32),
      jurisdiction,
      authority: breakdown.authority.slice(0, 80),
      businessActivity: businessActivity.slice(0, 120),
      visaCount,
      packageId: breakdown.packageId,
      packageName: breakdown.packageName,
      estimatedTotalAed: breakdown.totalAed,
      status: 'New Lead',
      currentStep: 1,
      source: 'Google Ads Calculator',
      pipedriveSyncStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (email.trim()) {
      orderPayload.email = email.trim().slice(0, 200);
    }
    if (pipedriveDealId) {
      orderPayload.pipedriveDealId = pipedriveDealId.slice(0, 64);
    }
    if (pipedrivePersonId) {
      orderPayload.pipedrivePersonId = pipedrivePersonId.slice(0, 64);
    }
    if (pipedriveError) {
      orderPayload.pipedriveError = pipedriveError.slice(0, 300);
    }

    batch.set(orderRef, orderPayload);
    batch.set(statusRef, {
      trackingCode,
      jurisdiction,
      authority: breakdown.authority.slice(0, 80),
      packageName: breakdown.packageName,
      visaCount,
      estimatedTotalAed: breakdown.totalAed,
      status: 'New Lead',
      currentStep: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      setUnlockedTrackingCode(trackingCode);
      onQuoteCreated?.(trackingCode);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
      } catch {
        setErrorMsg('Unable to lock your quote right now. Please try again or tap WhatsApp.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const rawSite = cms.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;
  const whatsappMessage = encodeURIComponent(
    `Hi ${brandName}, I just calculated my Dubai setup quote (Ref: ${
      unlockedTrackingCode || 'NEW'
    }) — ${jurisdiction}, ${visaCount} visa(s), ${businessActivity}, Total: AED ${breakdown.totalAed.toLocaleString()}. Please share next steps.`
  );

  return (
    <div
      id="cost-calculator"
      className="spatial-glass flex h-full flex-col justify-between rounded-2xl p-6 sm:p-7"
    >
      <div>
        {/* Card Header & 3-Step Progress Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold text-[#111827]">
              {unlockedTrackingCode ? 'Your Instant Setup Breakdown' : 'Instant Setup Cost Calculator'}
            </h2>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#008A72]">
              {unlockedTrackingCode ? 'Completed' : `Step ${step} of 3`}
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff0031] to-[#00b294] transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => !unlockedTrackingCode && setStep(1)}
              className={`text-left transition-colors ${
                step === 1 && !unlockedTrackingCode ? 'font-bold text-[#ff0031]' : 'text-slate-500'
              }`}
            >
              1. Jurisdiction
            </button>
            <button
              type="button"
              onClick={() => !unlockedTrackingCode && setStep(2)}
              className={`text-center transition-colors ${
                step === 2 && !unlockedTrackingCode ? 'font-bold text-[#ff0031]' : 'text-slate-500'
              }`}
            >
              2. Activity &amp; Visas
            </button>
            <button
              type="button"
              onClick={() => !unlockedTrackingCode && setStep(3)}
              className={`text-right transition-colors ${
                step === 3 || unlockedTrackingCode ? 'font-bold text-[#ff0031]' : 'text-slate-500'
              }`}
            >
              3. Price Quote
            </button>
          </div>
        </div>

        {/* STEP 1: Jurisdiction */}
        {!unlockedTrackingCode && step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Choose where you want your UAE license issued. Both options offer 100% foreign ownership.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setJurisdiction('Free Zone')}
                className={`flex min-h-[76px] items-start gap-3.5 rounded-lg border p-4 text-left transition-all ${
                  jurisdiction === 'Free Zone'
                    ? 'border-[#ff0031] bg-[#FFF5F7] ring-2 ring-[#ff0031]/15'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    jurisdiction === 'Free Zone'
                      ? 'bg-[#ff0031] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-[#111827]">All UAE Free Zones</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    All UAE Authorities · Remote setup · No office required
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setJurisdiction('Mainland')}
                className={`flex min-h-[76px] items-start gap-3.5 rounded-lg border p-4 text-left transition-all ${
                  jurisdiction === 'Mainland'
                    ? 'border-[#ff0031] bg-[#FFF5F7] ring-2 ring-[#ff0031]/15'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    jurisdiction === 'Mainland'
                      ? 'bg-[#ff0031] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-[#111827]">Dubai Mainland</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    DET LLC · Direct UAE local market &amp; tenders
                  </div>
                </div>
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#FAFAFB] px-4 py-3 text-xs text-slate-600">
              Selected authority: <span className="font-semibold text-[#111827]">{breakdown.authority}</span>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-[#ff0031] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D90029]"
            >
              <span>Continue to Activity &amp; Visas</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Activity & Visas */}
        {!unlockedTrackingCode && step === 2 && (
          <div className="space-y-5">
            <div>
              <label
                htmlFor="calc-activity"
                className="mb-1.5 block text-xs font-semibold text-[#1E293B]"
              >
                Primary Business Activity
              </label>
              <select
                id="calc-activity"
                value={businessActivity}
                onChange={(e) => setBusinessActivity(e.target.value)}
                className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-[#1E293B] focus:border-[#ff0031] focus:outline-none focus:ring-2 focus:ring-[#ff0031]/20"
              >
                {BUSINESS_ACTIVITIES.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="calc-visas"
                  className="text-xs font-semibold text-[#1E293B]"
                >
                  UAE Residence Visas Needed
                </label>
                <span className="font-mono text-sm font-bold tabular-nums text-[#ff0031]">
                  {visaCount} {visaCount === 1 ? 'Visa' : 'Visas'}
                </span>
              </div>

              <input
                id="calc-visas"
                type="range"
                min={0}
                max={6}
                step={1}
                value={visaCount}
                onChange={(e) => setVisaCount(Number(e.target.value))}
                className="visa-slider w-full"
              />

              <div className="mt-3 grid grid-cols-4 gap-2">
                {[0, 1, 2, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVisaCount(n)}
                    className={`min-h-[48px] rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                      visaCount === n
                        ? 'border-[#111827] bg-[#111827] text-white'
                        : 'border-slate-200 bg-[#FAFAFB] text-slate-700 hover:border-[#00b294]'
                    }`}
                  >
                    {n === 0 ? '0 Visas' : `${n} ${n === 1 ? 'Visa' : 'Visas'}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex min-h-[50px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#ff0031] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#D90029]"
              >
                <span>Calculate My Setup Cost</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Lead Capture to Unlock Breakdown */}
        {!unlockedTrackingCode && step === 3 && (
          <form onSubmit={handleUnlockQuote} className="space-y-3.5">
            <div className="rounded-lg border border-slate-200 bg-[#FAFAFB] px-3.5 py-2.5 text-xs text-slate-600">
              Quote ready for <span className="font-semibold text-[#111827]">{jurisdiction}</span> ·{' '}
              <span className="font-semibold tabular-nums text-[#ff0031]">{visaCount} Visa(s)</span> ·{' '}
              <span>{businessActivity}</span>
            </div>

            <div>
              <label htmlFor="lead-name" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                Founder Full Name
              </label>
              <input
                id="lead-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tariq Mahmood"
                className="min-h-[48px] w-full rounded-lg border border-slate-300 px-3.5 text-sm text-[#1E293B] placeholder:text-slate-400 focus:border-[#ff0031] focus:outline-none focus:ring-2 focus:ring-[#ff0031]/20"
              />
            </div>

            <div>
              <label htmlFor="lead-phone" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                WhatsApp Number
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Country code"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="min-h-[48px] w-[124px] shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 font-mono text-xs font-medium text-[#1E293B] focus:border-[#ff0031] focus:outline-none"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  id="lead-phone"
                  type="tel"
                  required
                  inputMode="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="50 482 9100"
                  className="min-h-[48px] w-full rounded-lg border border-slate-300 px-3.5 font-mono text-sm text-[#1E293B] placeholder:text-slate-400 focus:border-[#ff0031] focus:outline-none focus:ring-2 focus:ring-[#ff0031]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lead-email" className="mb-1 block text-xs font-semibold text-[#1E293B]">
                Work Email (Optional — for PDF breakdown)
              </label>
              <input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@company.com"
                className="min-h-[48px] w-full rounded-lg border border-slate-300 px-3.5 text-sm text-[#1E293B] placeholder:text-slate-400 focus:border-[#ff0031] focus:outline-none focus:ring-2 focus:ring-[#ff0031]/20"
              />
            </div>

            {errorMsg && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex min-h-[50px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#ff0031] px-5 text-sm font-bold text-white transition-colors hover:bg-[#D90029] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Instant Price Breakdown</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* UNLOCKED QUOTE BREAKDOWN */}
        {unlockedTrackingCode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#00b294]/35 bg-[#00b294]/[0.08] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#008A72]" />
                <div>
                  <div className="text-xs font-semibold text-[#111827]">
                    Quote Locked · Ref <span className="font-mono text-[#008A72]">{unlockedTrackingCode}</span>
                  </div>
                  <div className="text-xs text-[#008A72]">
                    {pipedriveNote || 'Saved to your formation tracker'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnlockedTrackingCode(null);
                  setStep(1);
                }}
                className="text-xs font-semibold text-[#111827] underline hover:text-[#ff0031]"
              >
                Recalculate
              </button>
            </div>

            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-[#FAFAFB] px-4 py-2 text-sm">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Trade License / Authority Fee ({breakdown.authority})</span>
                <span className="font-mono font-semibold tabular-nums text-[#111827]">
                  AED {breakdown.licenseFeeAed.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">
                  {jurisdiction === 'Free Zone' && visaCount === 0
                    ? 'Venture Zone Service & Filing Fee'
                    : 'Establishment Card & E-Channel'}
                </span>
                <span className="font-mono font-semibold tabular-nums text-[#111827]">
                  AED {breakdown.establishmentCardAed.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Visa Allocation ({visaCount})</span>
                <span className="font-mono font-semibold tabular-nums text-[#111827]">
                  AED {breakdown.visaAllocationAed.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Medical &amp; Emirates ID Typing</span>
                <span className="font-mono font-semibold tabular-nums text-[#111827]">
                  AED {breakdown.emiratesIdMedicalAed.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Bank KYC Pre-Vetting &amp; Coordination</span>
                <span className="font-mono font-semibold tabular-nums text-[#008A72]">
                  {breakdown.bankSupportFeeAed === 0
                    ? 'Included'
                    : `AED ${breakdown.bankSupportFeeAed.toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-display font-bold text-[#111827]">Total Estimated Setup</div>
                  <div className="text-xs text-slate-500">
                    Authority fees separated from service fee · Bank subject to KYC
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-bold tabular-nums text-[#ff0031]">
                    AED {breakdown.totalAed.toLocaleString()}
                  </div>
                  <div className="font-mono text-xs tabular-nums text-slate-500">
                    Approx. USD ${breakdown.totalUsd.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${cms.whatsappNumber.replace(/[^\d]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-[#00b294] px-5 text-sm font-bold text-white transition-colors hover:bg-[#00967C]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Reserve This Package on WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Card Footer Assurance */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#ff0031]" />
          <span>100% Government Fee Transparency</span>
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-[#00b294]" />
          <span>48h E-License</span>
        </span>
      </div>
    </div>
  );
}
