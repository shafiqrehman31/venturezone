export interface SafeJsonResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  isHtml: boolean;
  errorMessage?: string;
}

export function extractCleanErrorMessage(raw: unknown): string {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return 'Temporary connection hiccup. Please try again or tap Continue on WhatsApp App.';

    // Never surface raw HTML doctype or JSON parse errors to end users
    if (
      /<!doctype/i.test(trimmed) ||
      /<html/i.test(trimmed) ||
      /not valid JSON/i.test(trimmed) ||
      /Unexpected token/i.test(trimmed)
    ) {
      return 'Live server response was temporarily interrupted. Please try again or tap Continue on WhatsApp App.';
    }

    // Attempt to unwrap nested Gemini/API JSON error strings if present
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as {
          error?: string | { message?: string };
          message?: string;
        };
        if (typeof parsed.error === 'string') {
          return extractCleanErrorMessage(parsed.error);
        }
        if (parsed.error && typeof parsed.error === 'object' && typeof parsed.error.message === 'string') {
          return parsed.error.message;
        }
        if (typeof parsed.message === 'string') {
          return parsed.message;
        }
      } catch {
        // Fall through to clean text return
      }
    }

    return trimmed.slice(0, 220);
  }

  if (raw instanceof Error) {
    return extractCleanErrorMessage(raw.message);
  }

  return 'Assistant is temporarily busy. Tap Continue on WhatsApp App to chat directly with our Dubai advisors.';
}

export async function safeReadJson<T>(res: Response): Promise<SafeJsonResult<T>> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  let rawText = '';

  try {
    rawText = await res.text();
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      isHtml: false,
      errorMessage: 'Unable to read server response.',
    };
  }

  const trimmed = rawText.trim();
  const looksLikeHtml =
    contentType.includes('text/html') ||
    /^<!doctype\s+html/i.test(trimmed) ||
    /^<html[\s>]/i.test(trimmed) ||
    trimmed.startsWith('<');

  if (looksLikeHtml) {
    return {
      ok: false,
      status: res.status,
      data: null,
      isHtml: true,
      errorMessage: 'Server returned a web page instead of API data.',
    };
  }

  if (!trimmed) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      isHtml: false,
      errorMessage: res.ok ? undefined : `Empty server response (${res.status}).`,
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as T & { error?: unknown; message?: string };
    const rawErr = parsed && typeof parsed === 'object' ? parsed.error : undefined;
    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
      isHtml: false,
      errorMessage: !res.ok && rawErr ? extractCleanErrorMessage(rawErr) : undefined,
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      isHtml: false,
      errorMessage: extractCleanErrorMessage(trimmed),
    };
  }
}
