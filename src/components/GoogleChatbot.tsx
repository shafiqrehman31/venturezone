import { useEffect, useRef, useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { COUNTRY_CODES, detectDefaultCountryCode } from '../data/defaults';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import { buildGoogleBotFallbackReply } from '../lib/googleChatFallback';
import { safeReadJson } from '../lib/safeJson';
import type { CmsLandingConfig, JurisdictionType } from '../types/domain';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface GoogleChatbotProps {
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  onQuoteCreated?: (trackingCode: string) => void;
  onOpenContact?: () => void;
}

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function GoogleSparkleMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M12 2c.4 4.2 3.8 7.6 8 8-4.2.4-7.6 3.8-8 8-.4-4.2-3.8-7.6-8-8 4.2-.4 7.6-3.8 8-8Z"
      />
      <path
        fill="#EA4335"
        d="M12 2c.2 2.1 1.1 4 2.4 5.6L12 10V2Z"
      />
      <path
        fill="#FBBC05"
        d="M4 10c2.1-.2 4-1.1 5.6-2.4L12 10H4Z"
      />
      <path
        fill="#34A853"
        d="M12 18c-.2-2.1-1.1-4-2.4-5.6L12 10v8Z"
      />
    </svg>
  );
}

const QUICK_PROMPTS = [
  'Free Zone vs Mainland?',
  '1-Visa Package Cost',
  'UAE Bank Account for Founders',
  'Documents & 48h Timeline',
];

export function GoogleChatbot({
  cms,
  onQuoteCreated,
  onOpenContact,
}: GoogleChatbotProps) {
  const rawSite = cms.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;

  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      role: 'model',
      text: `Hello! I'm the ${brandName} Google AI Business Assistant. Ask me anything about UAE Free Zone vs. Dubai Mainland setup, AED package pricing, visas, or corporate banking.`,
      time: nowTimeLabel(),
    },
  ]);

  // Quick in-chat Callback / Quote Drawer
  const [showLeadCard, setShowLeadCard] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadCountryCode, setLeadCountryCode] = useState(() => detectDefaultCountryCode());
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadJurisdiction, setLeadJurisdiction] = useState<JurisdictionType>('Free Zone');
  const [savingLead, setSavingLead] = useState(false);
  const [leadError, setLeadError] = useState('');

  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending, showLeadCard, isOpen]);

  function openChat() {
    setIsOpen(true);
    setHasOpenedOnce(true);
  }

  function resetConversation() {
    setShowLeadCard(false);
    setLeadError('');
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'model',
        text: `Hello! Ready to help with your UAE company formation at ${brandName}. Ask about packages, banking, or tap "Request Callback" to lock a quote.`,
        time: nowTimeLabel(),
      },
    ]);
  }

  async function sendMessage(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
      time: nowTimeLabel(),
    };

    const nextThread = [...messages, userMsg];
    setMessages(nextThread);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/google-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextThread
            .filter((m) => !m.id.startsWith('welcome_'))
            .map((m) => ({ role: m.role, text: m.text })),
          context: {
            siteName: brandName,
            zeroVisaPriceAed: cms.zeroVisaPriceAed,
            oneVisaPriceAed: cms.oneVisaPriceAed,
            mainlandPriceAed: cms.mainlandPriceAed,
          },
        }),
      });

      const parsed = await safeReadJson<{ reply?: string; error?: string }>(res);
      if (parsed.ok && parsed.data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m_${Date.now()}`,
            role: 'model',
            text: parsed.data!.reply!,
            time: nowTimeLabel(),
          },
        ]);
        return;
      }

      // Built-in knowledge engine guarantees instant answers even on static hosts
      const fallbackReply = buildGoogleBotFallbackReply(trimmed, {
        brandName,
        zeroVisaPriceAed: cms.zeroVisaPriceAed,
        oneVisaPriceAed: cms.oneVisaPriceAed,
        mainlandPriceAed: cms.mainlandPriceAed,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: fallbackReply,
          time: nowTimeLabel(),
        },
      ]);
    } catch {
      const fallbackReply = buildGoogleBotFallbackReply(trimmed, {
        brandName,
        zeroVisaPriceAed: cms.zeroVisaPriceAed,
        oneVisaPriceAed: cms.oneVisaPriceAed,
        mainlandPriceAed: cms.mainlandPriceAed,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: fallbackReply,
          time: nowTimeLabel(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError('');
    const cleanPhone = leadPhone.replace(/[^\d]/g, '');
    if (leadName.trim().length < 2 || cleanPhone.length < 6 || cleanPhone.length > 15) {
      setLeadError('Enter your full name and a valid phone number (6-15 digits).');
      return;
    }

    setSavingLead(true);
    const trackingCode = `MRD-${Math.floor(1000 + Math.random() * 9000)}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const estimatedTotalAed =
      leadJurisdiction === 'Mainland' ? cms.mainlandPriceAed : cms.oneVisaPriceAed;
    const authority =
      leadJurisdiction === 'Mainland'
        ? 'Dubai Economy & Tourism (DET)'
        : 'All UAE Free Zone Authorities';
    const packageName =
      leadJurisdiction === 'Mainland' ? 'Mainland LLC' : '1-Visa All-Inclusive';

    let pipedriveSyncStatus: 'pending' | 'synced' | 'pending_config' | 'failed' = 'pending';
    let pipedriveDealId: string | undefined;
    let pipedrivePersonId: string | undefined;

    try {
      const syncRes = await fetch('/api/pipedrive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode,
          fullName: leadName.trim(),
          countryCode: leadCountryCode,
          whatsappNumber: cleanPhone,
          email: leadEmail.trim() || undefined,
          jurisdiction: leadJurisdiction,
          authority,
          businessActivity: 'Google AI Chatbot Inquiry',
          visaCount: 1,
          packageName,
          estimatedTotalAed,
          source: 'Google AI Chatbot',
        }),
      });
      const parsedSync = await safeReadJson<{
        syncStatus?: 'synced' | 'pending_config' | 'failed';
        pipedriveDealId?: string;
        pipedrivePersonId?: string;
      }>(syncRes);
      const json = parsedSync.data;
      if (json?.syncStatus) {
        pipedriveSyncStatus = json.syncStatus;
        pipedriveDealId = json.pipedriveDealId;
        pipedrivePersonId = json.pipedrivePersonId;
      }
    } catch {
      pipedriveSyncStatus = 'pending';
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', orderId), {
      trackingCode,
      fullName: leadName.trim().slice(0, 120),
      countryCode: leadCountryCode.slice(0, 8),
      whatsappNumber: cleanPhone.slice(0, 32),
      ...(leadEmail.trim() ? { email: leadEmail.trim().slice(0, 200) } : {}),
      jurisdiction: leadJurisdiction,
      authority,
      businessActivity: 'Google AI Chatbot Inquiry',
      visaCount: 1,
      packageId: leadJurisdiction === 'Mainland' ? 'mainland-llc' : 'one-visa',
      packageName,
      estimatedTotalAed,
      status: 'New Lead',
      currentStep: 1,
      source: 'Google AI Chatbot',
      pipedriveSyncStatus,
      ...(pipedriveDealId ? { pipedriveDealId } : {}),
      ...(pipedrivePersonId ? { pipedrivePersonId } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'orderStatus', trackingCode), {
      trackingCode,
      jurisdiction: leadJurisdiction,
      authority,
      packageName,
      visaCount: 1,
      estimatedTotalAed,
      status: 'New Lead',
      currentStep: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      setShowLeadCard(false);
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      onQuoteCreated?.(trackingCode);
      setMessages((prev) => [
        ...prev,
        {
          id: `lead_ok_${Date.now()}`,
          role: 'model',
          text: `Quote locked! Reference: ${trackingCode} (${packageName} · AED ${estimatedTotalAed.toLocaleString()}). A ${brandName} advisor will reach out to you on ${leadCountryCode} ${cleanPhone} shortly.`,
          time: nowTimeLabel(),
        },
      ]);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
      } catch {
        setLeadError('Unable to save quote right now. Please try the Contact Us page.');
      }
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <>
      {/* Floating Google AI Chatbot Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={openChat}
          aria-label="Open Google AI Assistant"
          className="fixed bottom-20 right-4 z-40 flex h-14 items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 text-[#111827] shadow-[0_14px_34px_-6px_rgba(66,133,244,0.35)] transition-transform duration-150 hover:scale-105 hover:border-[#4285F4] md:bottom-6 md:right-6"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9]">
            <GoogleSparkleMark className="h-5 w-5" />
            {!hasOpenedOnce && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4285F4] font-mono text-[10px] font-bold text-white">
                1
              </span>
            )}
          </span>
          <span className="hidden pr-1 text-left sm:block">
            <span className="block text-xs font-bold tracking-tight text-[#111827]">
              Google AI Chat
            </span>
            <span className="block text-[10px] font-medium text-slate-500">
              Ask about UAE Setup
            </span>
          </span>
        </button>
      )}

      {/* Google AI Chatbot Window */}
      {isOpen && (
        <section
          aria-label="Google AI Formation Assistant"
          className="fixed bottom-20 right-3 left-3 z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-6 sm:w-[395px] md:bottom-6"
        >
          {/* Google AI Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#F8FAFC]">
                  <GoogleSparkleMark className="h-5 w-5" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#34A853]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate font-display text-sm font-bold text-[#111827]">
                    <span className="truncate">Google AI Assistant</span>
                    <span className="rounded bg-[#EFF6FF] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#1D4ED8]">
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Sparkles className="h-3 w-3 shrink-0 text-[#4285F4]" />
                    <span className="truncate">{brandName} · Instant UAE Setup Answers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetConversation}
                  title="New chat"
                  aria-label="Start new Google AI chat"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#111827]"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  aria-label="Close Google AI chatbot"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#111827]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Google 4-color accent bar */}
            <div className="mt-2.5 grid h-0.5 grid-cols-4 overflow-hidden rounded-full">
              <div className="bg-[#4285F4]" />
              <div className="bg-[#EA4335]" />
              <div className="bg-[#FBBC05]" />
              <div className="bg-[#34A853]" />
            </div>
          </div>

          {/* Advisor Action Strip */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#F8FAFC] px-3.5 py-2 text-[11px]">
            <button
              type="button"
              onClick={() => setShowLeadCard((prev) => !prev)}
              className="inline-flex items-center gap-1.5 font-bold text-[#111827] hover:text-[#4285F4]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#34A853]" />
              <span>{showLeadCard ? 'Hide Quote Form' : 'Request Advisor Callback'}</span>
            </button>

            {onOpenContact ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenContact();
                }}
                className="inline-flex items-center gap-1 font-bold text-[#1D4ED8] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email Proposal</span>
              </button>
            ) : (
              <a
                href={`mailto:info@venturezoneuae.com?subject=${encodeURIComponent('UAE Company Setup Proposal Request')}`}
                className="inline-flex items-center gap-1 font-bold text-[#1D4ED8] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email Advisor</span>
              </a>
            )}
          </div>

          {/* Chat Message Canvas */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'rounded-br-sm bg-[#1D4ED8] text-white shadow-sm'
                        : 'rounded-bl-sm border border-slate-200/80 bg-white text-[#1E293B] shadow-sm'
                    }`}
                  >
                    {!isUser && (
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <GoogleSparkleMark className="h-3 w-3" />
                        <span>Google AI</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isUser ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      <span className="font-mono">{msg.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-600 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4285F4]" />
                  <span>Thinking with Google AI...</span>
                </div>
              </div>
            )}

            {/* In-Chat Lead Capture Form */}
            {showLeadCard && (
              <form
                onSubmit={handleLeadSubmit}
                className="space-y-2.5 rounded-xl border border-blue-200 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-[#111827]">
                    Lock Instant Quote &amp; Callback
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLeadCard(false)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Close quote form"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(['Free Zone', 'Mainland'] as JurisdictionType[]).map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setLeadJurisdiction(j)}
                      className={`min-h-[36px] rounded-lg border text-[11px] font-semibold ${
                        leadJurisdiction === j
                          ? 'border-[#111827] bg-[#111827] text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Your full name"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-xs focus:border-[#4285F4] focus:outline-none"
                />

                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Email for PDF proposal (optional)"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-xs focus:border-[#4285F4] focus:outline-none"
                />

                <div className="flex gap-1.5">
                  <select
                    value={leadCountryCode}
                    onChange={(e) => setLeadCountryCode(e.target.value)}
                    aria-label="Phone country dial code"
                    className="min-h-[40px] w-24 shrink-0 rounded-lg border border-slate-300 bg-white px-1.5 font-mono text-[11px]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="50 482 9100"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 px-2.5 font-mono text-xs focus:border-[#4285F4] focus:outline-none"
                  />
                </div>

                {leadError && <p className="text-[11px] text-red-600">{leadError}</p>}

                <button
                  type="submit"
                  disabled={savingLead}
                  className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] text-xs font-bold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-60"
                >
                  {savingLead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{savingLead ? 'Saving Quote...' : 'Lock Quote & Request Callback'}</span>
                </button>
              </form>
            )}

            <div ref={scrollEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
            {QUICK_PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(chip)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-semibold text-[#111827] transition-colors hover:border-[#4285F4] hover:bg-[#EFF6FF] disabled:opacity-50"
              >
                <MessageSquare className="h-3 w-3 text-[#4285F4]" />
                <span>{chip}</span>
              </button>
            ))}
          </div>

          {/* Message Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Google AI about UAE setup..."
              aria-label="Message Google AI assistant"
              className="min-h-[42px] flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-xs text-[#1E293B] placeholder:text-slate-400 focus:border-[#4285F4] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
