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

app.get(['/booklet.pdf', '/api/booklet.pdf'], (req, res) => {
  const candidates = [
    path.join(__dirname, 'public', 'booklet.pdf'),
    path.join(__dirname, 'dist', 'booklet.pdf'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    res.status(404).json({ error: 'Proposal booklet PDF not found.' });
    return;
  }

  const pdfBuffer = fs.readFileSync(filePath);
  const disposition = req.query.view === '1' ? 'inline' : 'attachment';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="venturezoneuae-booklet.pdf"`
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
          `Jurisdiction: ${payload.jurisdiction || 'Free Zone'} (${payload.authority || 'Meydan'})`,
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
  const zeroPrice = Number(body.context?.zeroVisaPriceAed || 11500).toLocaleString();
  const onePrice = Number(body.context?.oneVisaPriceAed || 17900).toLocaleString();
  const mainlandPrice = Number(body.context?.mainlandPriceAed || 23500).toLocaleString();

  const systemInstruction = [
    `You are the official WhatsApp Business Formation Assistant for ${brandName}, a Dubai Free Zone & Mainland company formation consultancy in the UAE.`,
    `Tone: crisp, warm, trustworthy, executive WhatsApp-style replies (concise 2-4 short sentences or 3 tight bullet points max; never write long essays).`,
    `Formatting: Write plain text only. Do NOT use markdown asterisks (**), hashtags (#), or code blocks.`,
    `Never mention a physical street address or landline phone number—support is WhatsApp & online only.`,
    `Live AED Formation Packages (AED 1,000 reduced across every category):`,
    `- Zero-Visa Free Zone License (Meydan / RAKEZ): AED ${zeroPrice} (RAKEZ from AED 10,800; IFZA from AED 13,900; DMCC from AED 28,500).`,
    `- 1-Visa All-Inclusive Free Zone Package: AED ${onePrice} (Most Popular; includes 2-year UAE investor visa, Emirates ID, VIP medical, Establishment Card, and Wio/Mashreq corporate bank pre-vetting).`,
    `- Dubai Mainland LLC (DET): AED ${mainlandPrice} (Trade anywhere across UAE local market & government tenders, 100% ownership, 1 investor visa included).`,
    `DMCC Business Centres, Offices, Permits & Visas (- AED 1,000 off standard rates):`,
    `- Business Centres: Flexi Desks AED 15,000/yr, Co-Working Desks AED 18,000/yr, Serviced Desks AED 24,000/yr, Serviced Offices AED 34,000/yr.`,
    `- Premium Offices: Almas Tower AED 77,000/yr, Silver Tower AED 49,000/yr, Detached AED 49,000/yr, J&G Premium/Fitted AED 34,000/yr.`,
    `- Permits & Visas: Office Sharing Permit AED 1,515, Dual Licence Permit AED 4,000, 1-Yr Visa AED 1,237, 2-Yr Standard Visa AED 1,973 (bulk tiers AED 898 - AED 1,276).`,
    `Key Facts:`,
    `- Incorporation is 100% remote in 48 hours for E-License; visa holders only visit Dubai once for a 3-day biometrics & medical trip.`,
    `- 0% personal income tax; 0% corporate tax on qualifying Free Zone income or Mainland profits under AED 375,000.`,
    `- Corporate banking support (Wio Business 3-5 days, Mashreq NeoBiz, RAKBANK) for global founders including Pakistan, India, UK, GCC, US, Europe.`,
    `- Founders can also download our proposal booklet at /booklet.pdf.`,
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
