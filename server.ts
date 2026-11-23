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

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({
      error: 'Gemini AI assistant key is not configured yet. Tap "Open in WhatsApp" to chat directly with our Dubai advisors.',
    });
    return;
  }

  const rawSite = body.context?.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;
  const zeroPrice = Number(body.context?.zeroVisaPriceAed || 5000).toLocaleString();
  const onePrice = Number(body.context?.oneVisaPriceAed || 10900).toLocaleString();
  const mainlandPrice = Number(body.context?.mainlandPriceAed || 12900).toLocaleString();

  const systemInstruction = [
    `You are the official WhatsApp Business Formation Assistant for ${brandName}, a UAE Free Zone & Dubai Mainland company formation consultancy.`,
    `Tone: crisp, warm, trustworthy, executive WhatsApp-style replies (concise 2-4 short sentences or 3 tight bullet points max; never write long essays).`,
    `Formatting: Write plain text only. Do NOT use markdown asterisks (**), hashtags (#), or code blocks.`,
    `Never mention a physical street address or landline phone number—support is online, WhatsApp & email (info@venturezoneuae.com) only.`,
    `We cover ALL UAE Free Zone authorities (including RAKEZ, SHAMS, Ajman, Meydan, IFZA, DMCC & more) plus Dubai Mainland (DET) with market-lowest transparent rates:`,
    `- Zero-Visa All UAE Free Zone License: AED ${zeroPrice} (RAKEZ/SHAMS/Ajman from AED 5,000; Meydan from AED 7,500; IFZA from AED 9,900; DMCC from AED 19,500).`,
    `- 1-Visa All-Inclusive Free Zone Package: AED ${onePrice} (Most Popular; includes 2-year UAE investor visa, Emirates ID, VIP medical, Establishment Card, and Wio/Mashreq corporate bank pre-vetting).`,
    `- Dubai Mainland LLC (DET): AED ${mainlandPrice} (Trade anywhere across UAE local market & government tenders, 100% ownership, 1 investor visa included).`,
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      throw new Error('Empty response received from assistant.');
    }

    res.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to generate reply right now.';
    res.status(502).json({
      error: msg.slice(0, 240),
    });
  }
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
    `Attached to this email is our Company Profile & Lowest-Price Setup Proposal (venturezoneuae-company-profile.pdf), covering all UAE Free Zone authorities and Dubai Mainland (DET):`,
    ``,
    `- Zero-Visa All UAE Free Zone License: Starting from AED 5,000`,
    `- 1-Visa All-Inclusive Free Zone Package: AED 10,900 (Includes 2-Yr Investor Visa, Emirates ID & Banking Desk)`,
    `- Dubai Mainland LLC (DET): AED 12,900 (Full UAE Local Market & Tenders, 100% Ownership)`,
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
                Please find attached our official <strong>Company Profile &amp; 2026 Pricing Proposal</strong> (<code>venturezoneuae-company-profile.pdf</code>), covering all UAE Free Zone authorities and Dubai Mainland (DET).
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border:1px solid #E2E8F0;border-radius:12px;background:#FAFAFB;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;">
                    <strong style="color:#111827;">Zero-Visa All UAE Free Zone License</strong><br/>
                    <span style="color:#64748B;">RAKEZ, SHAMS, Ajman, Meydan, IFZA &amp; all UAE Free Zones</span>
                  </td>
                  <td align="right" style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:14px;font-weight:700;color:#ff0031;white-space:nowrap;">AED 5,000</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;">
                    <strong style="color:#111827;">1-Visa All-Inclusive Free Zone Package</strong><br/>
                    <span style="color:#64748B;">License + 2-Yr Investor Visa + Emirates ID + Banking Support</span>
                  </td>
                  <td align="right" style="padding:14px 16px;border-bottom:1px solid #E2E8F0;font-size:14px;font-weight:700;color:#ff0031;white-space:nowrap;">AED 10,900</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;font-size:13px;">
                    <strong style="color:#111827;">Dubai Mainland LLC (DET)</strong><br/>
                    <span style="color:#64748B;">100% Ownership · Full UAE Local Trading &amp; 1 Investor Visa</span>
                  </td>
                  <td align="right" style="padding:14px 16px;font-size:14px;font-weight:700;color:#ff0031;white-space:nowrap;">AED 12,900</td>
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
