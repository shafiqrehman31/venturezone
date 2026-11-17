export async function downloadProposalBooklet(): Promise<void> {
  const endpoints = ['/booklet.pdf', '/api/booklet.pdf'];
  let pdfBytes: ArrayBuffer | null = null;
  let lastError = 'Unable to download the proposal booklet right now.';

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        lastError = `Download failed (HTTP ${res.status}).`;
        continue;
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength < 100) {
        lastError = 'Downloaded PDF file was empty.';
        continue;
      }

      // Verify exact "%PDF-" magic bytes so an HTML fallback page is never saved as .pdf
      const header = new Uint8Array(buf.slice(0, 5));
      const sig = String.fromCharCode(...header);
      if (sig !== '%PDF-') {
        lastError = 'Server returned a non-PDF response instead of the booklet file.';
        continue;
      }

      pdfBytes = buf;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
    }
  }

  if (!pdfBytes) {
    throw new Error(lastError);
  }

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = 'venturezoneuae-booklet.pdf';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 15000);
}
