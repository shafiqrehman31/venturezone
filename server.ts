import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json({ limit: '256kb' }));

interface PipedriveSyncPayload {
  trackingCode: string;
  fullName: string;
  countryCode: string;
  whatsappNumber: string;
  email?: string;
  jurisdiction: string;
  authority: string;
  businessActivity: string;
  visaCount: number;
  packageName: string;
  estimatedTotalAed: number;
  source?: string;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get(['/company-profile.pdf', '/booklet.pdf', '/api/booklet.pdf'], (req, res) => {
  const candidates = [
    path.join(__dirname, 'public', 'booklet.pdf'),
    path.join(__dirname, 'dist', 'booklet.pdf'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    res.status(404).json({ error: 'Company Profile PDF not found.' });
    return;
  }

  const pdfBuffer = fs.readFileSync(filePath);
  const disposition = req.query.view === '1' ? 'inline' : 'attachment';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="venturezoneuae-company-profile.pdf"`
  );
  res.setHeader('Content-Length', String(pdfBuffer.length));
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).end(pdfBuffer);
});

app.get('/api/pipedrive/status', (_req, res) => {
  const token = process.env.PIPEDRIVE_API_TOKEN?.trim();
  const domain = process.env.PIPEDRIVE_COMPANY_DOMAIN?.trim() || 'api';
  res.json({
    configured: Boolean(token && token.length > 5),
    domain,
    endpoint: `https://${domain}.pipedrive.com/api/v1`,
  });
});

app.post('/api/pipedrive/sync', async (req, res) => {
  const payload = req.body as Partial<PipedriveSyncPayload>;

  if (
    !payload ||
    typeof payload.trackingCode !== 'string' ||
    typeof payload.fullName !== 'string' ||
    typeof payload.whatsappNumber !== 'string'
  ) {
    res.status(400).json({
      syncStatus: 'failed',
      error: 'Missing required lead fields for Pipedrive CRM sync.',
    });
    return;
  }

  const token = process.env.PIPEDRIVE_API_TOKEN?.trim();
  const domain = process.env.PIPEDRIVE_COMPANY_DOMAIN?.trim() || 'api';

  if (!token) {
    res.json({
      syncStatus: 'pending_config',
      message: 'PIPEDRIVE_API_TOKEN is not configured in server secrets; lead staged for sync.',
    });
    return;
  }

  const baseUrl = `https://${domain}.pipedrive.com/api/v1`;
  const fullPhone = `${payload.countryCode || '+971'}${payload.whatsappNumber}`.replace(/\s+/g, '');

  try {
    const personRes = await fetch(`${baseUrl}/persons?api_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: payload.fullName,
        phone: [{ value: fullPhone, primary: true, label: 'whatsapp' }],
        ...(payload.email ? { email: [{ value: payload.email, primary: true, label: 'work' }] } : {}),
      }),
    });

    const personJson = (await personRes.json()) as {
      success?: boolean;
      data?: { id?: number };
      error?: string;
    };

    if (!personRes.ok || !personJson.success || !personJson.data?.id) {
      throw new Error(personJson.error || `Pipedrive Person API returned ${personRes.status}`);
    }

    const personId = String(personJson.data.id);

    const dealRes = await fetch(`${baseUrl}/deals?api_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[${payload.trackingCode}] ${payload.fullName} — ${payload.packageName || 'UAE Setup'}`,
        person_id: personJson.data.id,
        value: Number(payload.estimatedTotalAed || 0),
        currency: 'AED',
      }),
    });

    const dealJson = (await dealRes.json()) as {
      success?: boolean;
      data?: { id?: number };
      error?: string;
    };

    if (!dealRes.ok || !dealJson.success || !dealJson.data?.id) {
      throw new Error(dealJson.error || `Pipedrive Deal API returned ${dealRes.status}`);
    }

    const dealId = String(dealJson.data.id);

    await fetch(`${baseUrl}/notes?api_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deal_id: dealJson.data.id,
        person_id: personJson.data.id,
        content: [
          `<b>venturezoneuae.com Quote Summary</b>`,
          `Reference: ${payload.trackingCode}`,
          `Jurisdiction: ${payload.jurisdiction || 'Free Zone'} (${payload.authority || 'All UAE Free Zone Authorities'})`,
          `Activity: ${payload.businessActivity || 'Consultancy'}`,
          `Visas: ${payload.visaCount ?? 0}`,
          `Estimated Total: AED ${Number(payload.estimatedTotalAed || 0).toLocaleString()}`,
          `Traffic Source: ${payload.source || 'Google Ads Landing'}`,
        ].join('<br/>'),
      }),
    }).catch(() => undefined);

    res.json({
      syncStatus: 'synced',
      pipedrivePersonId: personId,
      pipedriveDealId: dealId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Pipedrive API error';
    res.status(502).json({
      syncStatus: 'failed',
      error: message.slice(0, 280),
    });
  }
});

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

function buildServerWhatsAppFallback(
  userQuestion: string,
  opts: {
    brandName: string;
    zeroPrice: string;
    onePrice: string;
    mainlandPrice: string;
  }
): string {
  const q = userQuestion.toLowerCase();

  if (
    q.includes('bank') ||
    q.includes('wio') ||
    q.includes('mashreq') ||
    q.includes('rakbank') ||
    q.includes('account')
  ) {
    return [
      `At ${opts.brandName}, we coordinate KYC pre-vetting and onboarding with Wio Business (typically 3-5 working days), Mashreq NeoBiz, RAKBANK, and Emirates NBD.`,
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
      `- Free Zone (AED ${opts.zeroPrice} 0-Visa / AED ${opts.onePrice} 1-Visa): Ideal for remote founders, e-commerce, software, and international consulting with 100% remote setup in 48 hours.`,
      `- Dubai Mainland DET (AED ${opts.mainlandPrice} with 1 Visa): Best if you want to trade directly across the UAE local market, lease a Dubai retail/office space, or bid on government tenders.`,
      `We cover all UAE Free Zone authorities (RAKEZ, SHAMS, Ajman, Meydan, IFZA, DMCC & more) plus DET Mainland. Tap "Request WhatsApp Callback" for a tailored match.`,
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
      `Your UAE Free Zone e-license can be issued 100% remotely within 48 hours after passport verification and name approval.`,
      `If you choose a 1-Visa package (AED ${opts.onePrice}), you only need to visit Dubai once for a 3-day biometrics and VIP medical appointment for your Emirates ID.`,
      `Download our step-by-step guide at /company-profile.pdf or tap "Request WhatsApp Callback" to lock your quote.`,
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
      `Our transparent ${opts.brandName} packages (Authority/Gov fees separated from Venture Zone service fees):`,
      `- 0-Visa Free Zone License: AED ${opts.zeroPrice} (Gov AED 5,200 + Service AED 799)`,
      `- 1-Visa Free Zone All-Inclusive: AED ${opts.onePrice} (Gov AED 8,750 + Service AED 1,750 — includes Visa, EID, Medical & Bank KYC prep)`,
      `- Dubai Mainland DET Setup: AED ${opts.mainlandPrice} (Gov AED 9,199 + Service AED 1,800 — includes 1 Visa & full UAE market access)`,
      `Tap "Request WhatsApp Callback" above to lock your custom quote in 15 seconds.`,
    ].join('\n\n');
  }

  return [
    `Thanks for reaching out to ${opts.brandName}! Here are our transparent starting packages across all UAE Free Zones & Dubai Mainland:`,
    `- 0-Visa Free Zone License: AED ${opts.zeroPrice} (48h remote setup)`,
    `- 1-Visa Free Zone Package: AED ${opts.onePrice} (includes 2-year Investor Visa & EID)`,
    `- Dubai Mainland DET Package: AED ${opts.mainlandPrice} (full UAE market access + 1 Visa)`,
    `Ask me about Free Zone vs. Mainland, corporate banking, or tap "Request WhatsApp Callback" to speak with an advisor.`,
  ].join('\n\n');
}

app.post('/api/whatsapp-bot', async (req, res) => {
  const body = req.body as {
    messages?: ChatTurn[];
    context?: {
      siteName?: string;
      zeroVisaPriceAed?: number;
      oneVisaPriceAed?: number;
      mainlandPriceAed?: number;
      phoneDisplay?: string;
    };
  };

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    res.status(400).json({ error: 'At least one message is required.' });
    return;
  }

  const rawSite = body.context?.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;
  const zeroPrice = Number(body.context?.zeroVisaPriceAed || 5999).toLocaleString();
  const onePrice = Number(body.context?.oneVisaPriceAed || 10500).toLocaleString();
  const mainlandPrice = Number(body.context?.mainlandPriceAed || 10999).toLocaleString();
  const lastUserQuestion =
    [...messages].reverse().find((m) => m.role === 'user')?.text || '';

  if (!process.env.GEMINI_API_KEY) {
    res.json({
      reply: buildServerWhatsAppFallback(lastUserQuestion, {
        brandName,
        zeroPrice,
        onePrice,
        mainlandPrice,
      }),
      fallback: true,
    });
    return;
  }

  const systemInstruction = [
    `You are the official WhatsApp Business Formation Assistant for ${brandName}, a UAE Free Zone & Dubai Mainland company formation consultancy.`,
    `Tone: crisp, warm, trustworthy, executive WhatsApp-style replies (concise 2-4 short sentences or 3 tight bullet points max; never write long essays).`,
    `Formatting: Write plain text only. Do NOT use markdown asterisks (**), hashtags (#), or code blocks.`,
    `Never mention a physical street address or landline phone number—support is online, WhatsApp & email (info@venturezoneuae.com) only.`,
    `Never promise or guarantee UAE corporate bank account approval—clarify that final approval rests with each bank's compliance/KYC team, while Venture Zone provides document pre-vetting and onboarding coordination.`,
    `We cover ALL UAE Free Zone authorities (RAKEZ, SHAMS, Ajman, Meydan, IFZA, DMCC & more) plus Dubai Mainland (DET) with transparent Authority/Gov Fees separated from Venture Zone Service Fees:`,
    `- 0-Visa Free Zone License: AED ${zeroPrice} (Authority/Gov ~AED 5,200 + Venture Zone Service AED 799; Year 2 renewal ~AED 5,200-6,200).`,
    `- 1-Visa All-Inclusive Free Zone Package: AED ${onePrice} (Authority/Gov ~AED 8,750 + Service AED 1,750; includes 2-year UAE investor visa, Emirates ID, VIP medical, Establishment Card, and Wio/Mashreq bank KYC pre-vetting).`,
    `- Dubai Mainland Instant Setup (DET): AED ${mainlandPrice} (Authority/Gov ~AED 9,199 + Service AED 1,800; trade anywhere across UAE local market & government tenders, 100% ownership, 1 investor visa included).`,
    `Workspace, Office, Permit & Visa lowest rates:`,
    `- Workspaces: Flexi Desks AED 5,000/yr, Co-Working Desks AED 8,500/yr, Serviced Desks AED 12,000/yr, Serviced Offices AED 18,000/yr.`,
    `- Premium Offices: Almas Tower AED 45,000/yr, Silver Tower AED 28,000/yr, Detached AED 28,000/yr, J&G Premium/Fitted AED 19,000/yr.`,
    `- Permits & Visas: Office Sharing Permit AED 950, Dual Licence Permit AED 2,500, 1-Yr Visa AED 950, 2-Yr Standard Visa AED 1,450 (bulk tiers AED 650 - AED 990).`,
    `Key Facts:`,
    `- Incorporation is 100% remote in 48 hours for E-License; visa holders only visit Dubai once for a 3-day biometrics & medical trip.`,
    `- 0% personal income tax; 0% corporate tax on qualifying Free Zone income or Mainland profits under AED 375,000.`,
    `- Corporate banking support (Wio Business 3-5 days, Mashreq NeoBiz, RAKBANK) for global founders including Pakistan, India, UK, GCC, US, Europe.`,
    `- Founders can download our Company Profile at /company-profile.pdf or submit the Contact Us page to receive it by email.`,
    `When a founder asks for pricing or next steps, summarize clearly in AED and encourage them to tap "Request WhatsApp Callback" inside the chat or use the Cost Calculator on the page.`,
  ].join('\n');

  const trimmedHistory = messages.slice(-12);
  const contents = trimmedHistory.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text || '').slice(0, 1200) }],
  }));

  const attempts: Array<{ model: string; useThinking: boolean }> = [
    { model: 'gemini-4-hydrogen', useThinking: true },
    { model: 'gemini-3.1-flash-lite', useThinking: false },
  ];

  let lastErrMsg = '';
  for (const attempt of attempts) {
    try {
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents,
        config: {
          systemInstruction,
          ...(attempt.useThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        res.json({ reply });
        return;
      }
      lastErrMsg = 'Empty response received from assistant.';
    } catch (err) {
      lastErrMsg = err instanceof Error ? err.message : 'Unable to generate reply right now.';
      console.warn(`[whatsapp-bot] ${attempt.model} failed:`, lastErrMsg.slice(0, 180));
    }
  }

  // Graceful fallback when upstream models experience transient high demand (503/429)
  res.json({
    reply: buildServerWhatsAppFallback(lastUserQuestion, {
      brandName,
      zeroPrice,
      onePrice,
      mainlandPrice,
    }),
    fallback: true,
  });
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHeaderLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function resolveCompanyProfilePdfBuffer(): Buffer | null {
  const candidates = [
    path.join(__dirname, 'public', 'booklet.pdf'),
    path.join(__dirname, 'dist', 'booklet.pdf'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  return filePath ? fs.readFileSync(filePath) : null;
}

interface ProposalEmailInput {
  fullName: string;
  email: string;
  countryCode: string;
  whatsappNumber: string;
  jurisdiction: string;
  serviceInterest: string;
  message?: string;
}

function buildProposalEmailTemplate(input: ProposalEmailInput) {
  const safeName = stripHeaderLineBreaks(input.fullName).slice(0, 120);
  const safeEmail = stripHeaderLineBreaks(input.email).slice(0, 200);
  const safePhone = stripHeaderLineBreaks(`${input.countryCode} ${input.whatsappNumber}`).slice(0, 40);
  const safeJurisdiction = stripHeaderLineBreaks(input.jurisdiction || 'All UAE Free Zones').slice(0, 80);
  const safeService = stripHeaderLineBreaks(input.serviceInterest || 'Company Formation').slice(0, 120);
  const safeMsg = (input.message || '').trim().slice(0, 1200);

  const subject = `Your UAE Business Setup Proposal & Company Profile — ${safeJurisdiction}`;

  const text = [
    `Dear ${safeName},`,
    ``,
    `Thank you for contacting venturezoneuae.com regarding ${safeService} (${safeJurisdiction}).`,
    ``,
    `Attached to this email is our Company Profile & Transparent Setup Proposal (venturezoneuae-company-profile.pdf), separating UAE Authority/Government fees from Venture Zone's fixed service fee across all UAE Free Zone authorities and Dubai Mainland (DET):`,
    ``,
    `- 0-Visa UAE Free Zone License: AED 5,999 (Authority/Gov AED 5,200 + Service AED 799)`,
    `- 1-Visa Free Zone (All-Inclusive): AED 10,500 (Authority/Gov AED 8,750 + Service AED 1,750)`,
    `- Dubai Mainland Instant Setup (DET): AED 10,999 (Authority/Gov AED 9,199 + Service AED 1,800)`,
    ``,
    `Note: Corporate banking accounts remain subject to the issuing bank's independent KYC/AML review (we provide pre-vetting and onboarding coordination). Official authority rates remain subject to UAE regulatory updates.`,
    ``,
    `Your Submitted Request Summary:`,
    `- Name: ${safeName}`,
    `- Email: ${safeEmail}`,
    `- WhatsApp: ${safePhone}`,
    `- Jurisdiction: ${safeJurisdiction}`,
    `- Service Interest: ${safeService}`,
    ...(safeMsg ? [`- Notes: ${safeMsg}`] : []),
    ``,
    `A senior UAE corporate formation advisor will review your preferred activity and reach out shortly with tailored authority recommendations.`,
    ``,
    `Best regards,`,
    `Venture Zone Corporate Advisory Desk`,
    `Email: info@venturezoneuae.com`,
    `Web: https://venturezoneuae.com`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#FAFAFB;font-family:Arial,Helvetica,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;background-color:#FAFAFB;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:24px 28px;border-bottom:4px solid #ff0031;">
              <div style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;">venturezoneuae.com</div>
              <div style="margin-top:4px;font-size:12px;color:#00b294;font-weight:700;">UAE COMPANY FORMATION PROPOSAL &amp; COMPANY PROFILE</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#111827;">Dear ${escapeHtml(safeName)},</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                Thank you for contacting <strong>venturezoneuae.com</strong> regarding <strong>${escapeHtml(safeService)}</strong> (${escapeHtml(safeJurisdiction)}).
                Please find attached our official <strong>Company Profile &amp; Transparent Pricing Proposal</strong> (<code>venturezoneuae-company-profile.pdf</code>), itemizing UAE Government/Authority fees vs. Venture Zone's fixed service fee.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border:1px solid #E2E8F0;border-radius:12px;background:#FAFAFB;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;">
                    <strong style="color:#111827;">0-Visa UAE Free Zone License</strong><br/>
                    <span style="color:#64748B;">Gov/Authority AED 5,200 + Venture Zone Service AED 799</span>
                  </td>
                  <td align="right" style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:14px;font-weight:700;color:#ff0031;white-space:nowrap;">AED 5,999</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;">
                    <strong style="color:#111827;">1-Visa Free Zone (All-Inclusive)</strong><br/>
                    <span style="color:#64748B;">Gov/Authority AED 8,750 + Service AED 1,750 · Visa + EID + Bank KYC</span>
                  </td>
                  <td align="right" style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:14px;font-weight:700;color:#ff0031;white-space:nowrap;">AED 10,500</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;font-size:13px;">
                    <strong style="color:#111827;">Dubai Mainland Instant Setup (DET)</strong><br/>
                    <span style="color:#64748B;">Gov/Authority AED 9,199 + Service AED 1,800 · Full UAE Market + 1 Visa</span>
                  </td>
                  <td align="right" style="padding:14px 16px;font-size:14px;font-weight:700;color:#ff0031;white-space:nowrap;">AED 10,999</td>
                </tr>
              </table>
              <div style="margin:18px 0;padding:14px 16px;border-left:4px solid #00b294;background:#F0FDFA;border-radius:8px;font-size:13px;color:#111827;">
                <strong>Your Inquiry Details</strong><br/>
                Email: ${escapeHtml(safeEmail)}<br/>
                WhatsApp: ${escapeHtml(safePhone)}<br/>
                Jurisdiction: ${escapeHtml(safeJurisdiction)}<br/>
                Service Interest: ${escapeHtml(safeService)}
                ${safeMsg ? `<br/>Notes: ${escapeHtml(safeMsg)}` : ''}
              </div>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                Our senior corporate formation specialist will follow up with exact authority options tailored to your business activity. Reply directly to this email anytime with questions.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#F8FAFC;padding:18px 28px;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;">
              <strong style="color:#111827;">Venture Zone Corporate Advisory Desk</strong><br/>
              Email: info@venturezoneuae.com &nbsp;|&nbsp; Web: https://venturezoneuae.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    toEmail: safeEmail,
    recipientName: safeName,
    text,
    html,
    attachmentName: 'venturezoneuae-company-profile.pdf',
  };
}

app.post('/api/contact/send-proposal', async (req, res) => {
  const body = req.body as Partial<ProposalEmailInput>;
  const fullName = String(body?.fullName || '').trim();
  const email = String(body?.email || '').trim();
  const countryCode = String(body?.countryCode || '+971').trim();
  const whatsappNumber = String(body?.whatsappNumber || '').trim();
  const jurisdiction = String(body?.jurisdiction || 'All UAE Free Zones').trim();
  const serviceInterest = String(body?.serviceInterest || 'Company Formation').trim();
  const message = typeof body?.message === 'string' ? body.message : '';

  if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid full name and email address are required.' });
    return;
  }

  const template = buildProposalEmailTemplate({
    fullName,
    email,
    countryCode,
    whatsappNumber,
    jurisdiction,
    serviceInterest,
    message,
  });

  const pdfBuffer = resolveCompanyProfilePdfBuffer();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'Venture Zone UAE <info@venturezoneuae.com>';

  if (!resendKey) {
    res.json({
      emailStatus: 'template_ready',
      emailNote: 'Personalized proposal email & PDF template prepared for advisor dispatch.',
      template: {
        subject: template.subject,
        toEmail: template.toEmail,
        recipientName: template.recipientName,
        bodyText: template.text,
        attachmentName: template.attachmentName,
        pdfAvailable: Boolean(pdfBuffer),
      },
    });
    return;
  }

  try {
    const attachments = pdfBuffer
      ? [
          {
            filename: 'venturezoneuae-company-profile.pdf',
            content: pdfBuffer.toString('base64'),
          },
        ]
      : [];

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [template.toEmail],
        reply_to: 'info@venturezoneuae.com',
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      res.status(502).json({
        emailStatus: 'failed',
        emailNote: `Email provider error (${emailRes.status}): ${errText.slice(0, 180)}`,
        template: {
          subject: template.subject,
          toEmail: template.toEmail,
          recipientName: template.recipientName,
          bodyText: template.text,
          attachmentName: template.attachmentName,
          pdfAvailable: Boolean(pdfBuffer),
        },
      });
      return;
    }

    res.json({
      emailStatus: 'sent',
      emailNote: `Proposal email with attached ${template.attachmentName} sent to ${template.toEmail}.`,
      template: {
        subject: template.subject,
        toEmail: template.toEmail,
        recipientName: template.recipientName,
        bodyText: template.text,
        attachmentName: template.attachmentName,
        pdfAvailable: Boolean(pdfBuffer),
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unable to send proposal email';
    res.status(502).json({
      emailStatus: 'failed',
      emailNote: errMsg.slice(0, 220),
      template: {
        subject: template.subject,
        toEmail: template.toEmail,
        recipientName: template.recipientName,
        bodyText: template.text,
        attachmentName: template.attachmentName,
        pdfAvailable: Boolean(pdfBuffer),
      },
    });
  }
});

app.post('/api/contact/proposal-eml', (req, res) => {
  const body = req.body as Partial<ProposalEmailInput>;
  const fullName = String(body?.fullName || '').trim();
  const email = String(body?.email || '').trim();
  const countryCode = String(body?.countryCode || '+971').trim();
  const whatsappNumber = String(body?.whatsappNumber || '').trim();
  const jurisdiction = String(body?.jurisdiction || 'All UAE Free Zones').trim();
  const serviceInterest = String(body?.serviceInterest || 'Company Formation').trim();
  const message = typeof body?.message === 'string' ? body.message : '';

  if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid full name and email address are required.' });
    return;
  }

  const template = buildProposalEmailTemplate({
    fullName,
    email,
    countryCode,
    whatsappNumber,
    jurisdiction,
    serviceInterest,
    message,
  });

  const pdfBuffer = resolveCompanyProfilePdfBuffer();
  const boundaryMixed = `----=_Mixed_${Date.now()}`;
  const boundaryAlt = `----=_Alt_${Date.now()}`;
  const chunkBase64 = (buf: Buffer) =>
    buf.toString('base64').replace(/(.{76})/g, '$1\r\n');

  const parts: string[] = [
    `From: Venture Zone UAE <info@venturezoneuae.com>`,
    `To: ${template.recipientName} <${template.toEmail}>`,
    `Subject: ${template.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
    ``,
    `--${boundaryMixed}`,
    `Content-Type: multipart/alternative; boundary="${boundaryAlt}"`,
    ``,
    `--${boundaryAlt}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    template.text,
    ``,
    `--${boundaryAlt}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    template.html,
    ``,
    `--${boundaryAlt}--`,
  ];

  if (pdfBuffer) {
    parts.push(
      `--${boundaryMixed}`,
      `Content-Type: application/pdf; name="venturezoneuae-company-profile.pdf"`,
      `Content-Disposition: attachment; filename="venturezoneuae-company-profile.pdf"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      chunkBase64(pdfBuffer)
    );
  }

  parts.push(`--${boundaryMixed}--`, ``);
  const emlContent = parts.join('\r\n');

  res.setHeader('Content-Type', 'message/rfc822');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="venturezoneuae-proposal-email.eml"'
  );
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(emlContent);
});

// Guarantee /api/* routes always return JSON and never fall through to Vite/static HTML
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.path.startsWith('/api')) {
      const msg = err instanceof Error ? err.message : 'Internal server error.';
      res.status(500).json({ error: msg.slice(0, 220) });
      return;
    }
    next(err);
  }
);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
