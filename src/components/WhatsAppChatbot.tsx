import { useEffect, useRef, useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { COUNTRY_CODES, detectDefaultCountryCode } from '../data/defaults';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import type { CmsLandingConfig, JurisdictionType } from '../types/domain';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface WhatsAppChatbotProps {
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  onQuoteCreated?: (trackingCode: string) => void;
}

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const QUICK_PROMPTS = [
  'Free Zone vs Mainland?',
  '1-Visa Package Cost',
  'UAE Bank Account for Founders',
  'How fast is 48h setup?',
];

export function WhatsAppChatbot({ cms, onQuoteCreated }: WhatsAppChatbotProps) {
  const rawSite = cms.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;
  const cleanWaDigits = cms.whatsappNumber.replace(/[^\d]/g, '');

  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [botError, setBotError] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      role: 'model',
      text: `Marhaba! Welcome to ${brandName} WhatsApp Desk. Ask me anything about Dubai Free Zone vs. Mainland formation, AED package pricing, visas, or corporate banking.`,
      time: nowTimeLabel(),
    },
  ]);

  // Quick in-chat Lead / Instant Callback drawer
  const [showLeadCard, setShowLeadCard] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadCountryCode, setLeadCountryCode] = useState(() => detectDefaultCountryCode());
  const [leadPhone, setLeadPhone] = useState('');
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
    setBotError('');
    setShowLeadCard(false);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'model',
        text: `Marhaba! Welcome to ${brandName} WhatsApp Desk. How can we help you launch your Dubai company today?`,
        time: nowTimeLabel(),
      },
    ]);
  }

  async function sendMessage(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    setBotError('');
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
      const res = await fetch('/api/whatsapp-bot', {
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

      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Assistant is temporarily unavailable.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.reply!,
          time: nowTimeLabel(),
        },
      ]);
    } catch (err) {
      setBotError(
        err instanceof Error
          ? err.message
          : 'Unable to reach assistant. Tap "Live WhatsApp" below to chat with an advisor.'
      );
    } finally {
      setSending(false);
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError('');
    const cleanPhone = leadPhone.replace(/[^\d]/g, '');
    if (leadName.trim().length < 2 || cleanPhone.length < 6 || cleanPhone.length > 15) {
      setLeadError('Enter your name and a valid WhatsApp number (6–15 digits).');
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
        : 'Meydan / IFZA Free Zone';
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
          jurisdiction: leadJurisdiction,
          authority,
          businessActivity: 'WhatsApp Chatbot Inquiry',
          visaCount: 1,
          packageName,
          estimatedTotalAed,
          source: 'WhatsApp AI Chatbot',
        }),
      });
      const json = (await syncRes.json()) as {
        syncStatus?: 'synced' | 'pending_config' | 'failed';
        pipedriveDealId?: string;
        pipedrivePersonId?: string;
      };
      if (json.syncStatus) {
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
      jurisdiction: leadJurisdiction,
      authority,
      businessActivity: 'WhatsApp Chatbot Inquiry',
      visaCount: 1,
      packageId: leadJurisdiction === 'Mainland' ? 'mainland-llc' : 'one-visa',
      packageName,
      estimatedTotalAed,
      status: 'New Lead',
      currentStep: 1,
      source: 'WhatsApp AI Chatbot',
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
      onQuoteCreated?.(trackingCode);
      setMessages((prev) => [
        ...prev,
        {
          id: `lead_ok_${Date.now()}`,
          role: 'model',
          text: `Quote locked! Reference: ${trackingCode} (${packageName} · AED ${estimatedTotalAed.toLocaleString()}). A ${brandName} advisor will message you on ${leadCountryCode} ${cleanPhone} shortly.`,
          time: nowTimeLabel(),
        },
      ]);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
      } catch {
        setLeadError('Could not save quote. Tap "Live WhatsApp" to connect directly.');
      }
    } finally {
      setSavingLead(false);
    }
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.text;
  const handoffHref = `https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
    lastUserMessage
      ? `Hi ${brandName}, continuing from website chat: "${lastUserMessage}"`
      : `Hi ${brandName}, I would like assistance with Dubai company formation.`
  )}`;

  return (
    <>
      {/* Floating WhatsApp Chatbot Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={openChat}
          aria-label="Open WhatsApp Chatbot Assistant"
          className="fixed bottom-20 right-4 z-40 flex h-14 items-center gap-2.5 rounded-full bg-[#00b294] px-4 text-white shadow-[0_12px_30px_-6px_rgba(0,178,148,0.5)] ring-2 ring-white/85 transition-transform duration-150 hover:scale-105 hover:bg-[#00967C] md:bottom-6 md:right-6"
        >
          <span className="relative flex items-center justify-center">
            <MessageCircle className="h-6 w-6" />
            {!hasOpenedOnce && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff0031] font-mono text-[10px] font-bold text-white">
                1
              </span>
            )}
          </span>
          <span className="hidden text-xs font-bold tracking-tight sm:inline">
            WhatsApp Chat
          </span>
        </button>
      )}

      {/* WhatsApp Chatbot Window */}
      {isOpen && (
        <section
          aria-label="WhatsApp Formation Chatbot"
          className="fixed bottom-20 right-3 left-3 z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-6 sm:w-[390px] md:bottom-6"
        >
          {/* WhatsApp Header */}
          <div className="flex items-center justify-between gap-3 bg-[#00b294] px-4 py-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#00b294]">
                <MessageCircle className="h-5 w-5 fill-current" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#00b294] bg-[#ff0031]" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-bold">
                  {brandName} WhatsApp Bot
                </div>
                <div className="flex items-center gap-1 text-[11px] text-white/90">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span className="truncate">Online · Instant AED Quotes &amp; Setup Help</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetConversation}
                title="Restart chat"
                aria-label="Restart chat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close WhatsApp chatbot"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Live WhatsApp Handoff Strip */}
          <div className="flex items-center justify-between border-b border-[#00b294]/20 bg-[#00b294]/[0.08] px-3.5 py-2 text-[11px]">
            <button
              type="button"
              onClick={() => setShowLeadCard((prev) => !prev)}
              className="inline-flex items-center gap-1 font-bold text-[#111827] hover:text-[#ff0031]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00b294]" />
              <span>{showLeadCard ? 'Hide Quote Form' : 'Request WhatsApp Callback'}</span>
            </button>

            <a
              href={handoffHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#008A72] hover:underline"
            >
              <span>Live WhatsApp</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Chat Message Canvas */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F4F6F8] p-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'rounded-br-sm bg-[#E0F7F3] text-[#111827]'
                        : 'rounded-bl-sm bg-white text-[#1E293B]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                      <span className="font-mono">{msg.time}</span>
                      {isUser && <CheckCheck className="h-3.5 w-3.5 text-[#00b294]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00b294]" />
                  <span>Typing...</span>
                </div>
              </div>
            )}

            {botError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p>{botError}</p>
                <a
                  href={handoffHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-bold text-[#008A72] underline"
                >
                  <span>Continue on WhatsApp App</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* In-Chat Lead Capture Form */}
            {showLeadCard && (
              <form
                onSubmit={handleLeadSubmit}
                className="space-y-2.5 rounded-xl border border-[#00b294]/30 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-[#111827]">
                    Lock Instant Quote on WhatsApp
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
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-xs focus:border-[#ff0031] focus:outline-none"
                />

                <div className="flex gap-1.5">
                  <select
                    value={leadCountryCode}
                    onChange={(e) => setLeadCountryCode(e.target.value)}
                    aria-label="WhatsApp country dial code"
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
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 px-2.5 font-mono text-xs focus:border-[#ff0031] focus:outline-none"
                  />
                </div>

                {leadError && <p className="text-[11px] text-red-600">{leadError}</p>}

                <button
                  type="submit"
                  disabled={savingLead}
                  className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#ff0031] text-xs font-bold text-white transition-colors hover:bg-[#D90029] disabled:opacity-60"
                >
                  {savingLead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{savingLead ? 'Saving Quote...' : 'Lock Quote & Notify Me'}</span>
                </button>
              </form>
            )}

            <div ref={scrollEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-[#FAFAFB] px-3 py-2">
            {QUICK_PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(chip)}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#111827] transition-colors hover:border-[#00b294] hover:bg-[#00b294]/[0.08] disabled:opacity-50"
              >
                {chip}
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
              placeholder="Type a message..."
              aria-label="Message WhatsApp bot"
              className="min-h-[42px] flex-1 rounded-xl border border-slate-200 bg-[#FAFAFB] px-3.5 text-xs text-[#1E293B] placeholder:text-slate-400 focus:border-[#00b294] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#00b294] text-white transition-colors hover:bg-[#00967C] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
