export function PartnerLogos() {
  return (
    <section
      aria-label="UAE Authorities and Banking Partners"
      className="border-y border-slate-200/80 bg-white/75 py-8 backdrop-blur-md"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-xs font-semibold tracking-wide text-slate-500">
          Registered Formation Partner Across Leading UAE Authorities &amp; Digital Business Banks
        </p>
        <div className="grid grid-cols-2 items-center justify-items-center gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {/* Dubai Economy */}
          <div className="flex items-center gap-2.5 text-slate-600 transition-colors hover:text-[#111827]">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.75" />
              <path d="M8 20V11L14 7L20 11V20" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
              <path d="M12 20V14H16V20" stroke="currentColor" strokeWidth="1.75" />
            </svg>
            <span className="font-display text-sm font-bold tracking-tight">Dubai Economy</span>
          </div>

          {/* Meydan Free Zone */}
          <div className="flex items-center gap-2.5 text-slate-600 opacity-85 transition-opacity hover:opacity-100">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M4 21L10 8L14 15L18 8L24 21H4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-sm font-bold tracking-tight">Meydan FZ</span>
          </div>

          {/* RAKEZ */}
          <div className="flex items-center gap-2.5 text-slate-600 opacity-85 transition-opacity hover:opacity-100">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="10.5" stroke="currentColor" strokeWidth="1.75" />
              <path d="M9.5 14H18.5M14 9.5V18.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <span className="font-display text-sm font-bold tracking-tight">RAKEZ</span>
          </div>

          {/* Wio Business */}
          <div className="flex items-center gap-2.5 text-slate-600 opacity-85 transition-opacity hover:opacity-100">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M5 9L9.5 19L14 11L18.5 19L23 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-sm font-bold tracking-tight">Wio Business</span>
          </div>

          {/* Mashreq NeoBiz */}
          <div className="col-span-2 flex items-center gap-2.5 text-slate-600 opacity-85 transition-opacity hover:opacity-100 sm:col-span-1">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="4" y="6" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.75" />
              <path d="M4 11.5H24" stroke="currentColor" strokeWidth="1.75" />
              <circle cx="9.5" cy="16.5" r="1.5" fill="currentColor" />
            </svg>
            <span className="font-display text-sm font-bold tracking-tight">Mashreq NeoBiz</span>
          </div>
        </div>
      </div>
    </section>
  );
}
