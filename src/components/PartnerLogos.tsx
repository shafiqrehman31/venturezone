import { useEffect, useRef, useState } from 'react';

interface PartnerItem {
  id: string;
  name: string;
  category: string;
  renderMark: () => React.ReactNode;
}

const PARTNERS: PartnerItem[] = [
  {
    id: 'det',
    name: 'Dubai Economy (DET)',
    category: 'Dubai Mainland Authority',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#111827" />
        <path d="M9 22V13L16 8.5L23 13V22" stroke="#FFFFFF" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M13.5 22V16H18.5V22" stroke="#00b294" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: 'meydan',
    name: 'Meydan Free Zone',
    category: 'Dubai Free Zone Authority',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#0F172A" />
        <path d="M7.5 22L12.5 10.5L16 17L19.5 10.5L24.5 22H7.5Z" stroke="#00b294" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'ifza',
    name: 'IFZA Dubai',
    category: 'Dubai Free Zone Authority',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#FFF1F2" stroke="#FECDD3" />
        <path d="M10 10V22" stroke="#ff0031" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14.5 10H22.5M14.5 16H20.5" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        <circle cx="21" cy="20.5" r="2" fill="#00b294" />
      </svg>
    ),
  },
  {
    id: 'dmcc',
    name: 'DMCC (JLT Dubai)',
    category: 'Global Commodity Free Zone',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#0F172A" />
        <polygon points="16,7 24,13.5 20.5,24 11.5,24 8,13.5" stroke="#38BDF8" strokeWidth="1.75" fill="none" />
        <circle cx="16" cy="16.5" r="2.3" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'rakez',
    name: 'RAKEZ',
    category: 'Ras Al Khaimah Economic Zone',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
        <circle cx="16" cy="16" r="7.5" stroke="#008A72" strokeWidth="1.9" />
        <path d="M11 16H21M16 11V21" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'shams',
    name: 'SHAMS',
    category: 'Sharjah Media City Free Zone',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#FFFBEB" stroke="#FDE68A" />
        <circle cx="16" cy="16" r="4.5" fill="#D97706" />
        <path d="M16 7.5V9.5M16 22.5V24.5M7.5 16H9.5M22.5 16H24.5" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ajman',
    name: 'Ajman Free Zone',
    category: 'Northern Emirates Free Zone',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#111827" />
        <path d="M9.5 22L16 9L22.5 22" stroke="#ff0031" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 18H20" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'dafza',
    name: 'DAFZA Dubai',
    category: 'Dubai Airport Freezone',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#F0FDFA" stroke="#99F6E4" />
        <path d="M9 19L23 11.5L17.5 22.5L15 17.5L9 19Z" stroke="#0F766E" strokeWidth="1.8" strokeLinejoin="round" fill="#00b294" fillOpacity="0.2" />
      </svg>
    ),
  },
  {
    id: 'dubaisouth',
    name: 'Dubai South',
    category: 'Logistics & Aviation Free Zone',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#EFF6FF" stroke="#BFDBFE" />
        <path d="M9 21C11 13.5 16 10 23 10C21 17 16.5 21 9 21Z" stroke="#1E40AF" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'adgm',
    name: 'ADGM Abu Dhabi',
    category: 'International Financial Centre',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#F8FAFC" stroke="#CBD5E1" />
        <path d="M9 22H23M11 22V13M16 22V11M21 22V13M9 11L16 8L23 11" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'wio',
    name: 'Wio Business',
    category: 'UAE Digital Business Bank',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#EEF2FF" stroke="#C7D2FE" />
        <path d="M7.5 11.5L11.8 21L16 13.5L20.2 21L24.5 11.5" stroke="#4F46E5" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'mashreq',
    name: 'Mashreq NeoBiz',
    category: 'SME Digital Business Bank',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#FFF7ED" stroke="#FED7AA" />
        <rect x="7" y="9" width="18" height="14" rx="2.5" stroke="#EA580C" strokeWidth="1.8" />
        <path d="M7 14H25" stroke="#EA580C" strokeWidth="1.8" />
        <circle cx="11.5" cy="18.5" r="1.5" fill="#111827" />
      </svg>
    ),
  },
  {
    id: 'rakbank',
    name: 'RAKBANK',
    category: 'UAE Corporate Banking',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#FEF2F2" stroke="#FECACA" />
        <path d="M10 22V10H17.5C20 10 21.5 11.3 21.5 13.5C21.5 15.7 20 17 17.5 17H10" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.5 17L21.5 22" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'enbd',
    name: 'Emirates NBD',
    category: 'Tier-1 UAE Commercial Bank',
    renderMark: () => (
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#0F172A" />
        <rect x="9" y="9.5" width="14" height="3.2" rx="1" fill="#FBBF24" />
        <rect x="9" y="14.4" width="11" height="3.2" rx="1" fill="#FFFFFF" />
        <rect x="9" y="19.3" width="14" height="3.2" rx="1" fill="#00b294" />
      </svg>
    ),
  },
];

export function PartnerLogos() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    let lastTs = 0;

    const tick = (ts: number) => {
      const el = scrollerRef.current;
      if (el && !paused) {
        if (lastTs) {
          const dt = Math.min(48, ts - lastTs);
          const halfWidth = el.scrollWidth / 2;
          if (halfWidth > 0) {
            el.scrollLeft += dt * 0.055;
            if (el.scrollLeft >= halfWidth) {
              el.scrollLeft -= halfWidth;
            }
          }
        }
      }
      lastTs = ts;
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [paused]);

  return (
    <section
      aria-label="UAE Authorities and Banking Partners"
      className="border-y border-slate-200/80 bg-white/75 py-10 backdrop-blur-md"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          className="mx-auto mb-8 max-w-3xl text-center font-display text-xl font-extrabold tracking-tight text-[#111827] sm:text-2xl"
          style={{ textWrap: 'balance' }}
        >
          Registered Formation Partner Across Leading UAE Authorities &amp; Digital Business Banks
        </h2>

        {/* Edge-faded continuous scrolling strip sized for 3 prominent partner logos at once */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white/95 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white/95 to-transparent"
          />

          <div
            ref={scrollerRef}
            className="flex overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max shrink-0 items-center gap-6">
              {[0, 1].map((dupIdx) => (
                <div
                  key={dupIdx}
                  aria-hidden={dupIdx === 1}
                  className="flex shrink-0 items-center gap-6"
                >
                  {PARTNERS.map((partner) => (
                    <div
                      key={`${dupIdx}-${partner.id}`}
                      className="flex w-[290px] shrink-0 items-center gap-4 rounded-2xl border border-slate-200/85 bg-white/95 p-5 shadow-[0_10px_24px_-14px_rgba(17,24,39,0.14)] transition-colors hover:border-[#00b294]/60 sm:w-[340px] lg:w-[356px]"
                    >
                      <div className="shrink-0">{partner.renderMark()}</div>
                      <div className="min-w-0">
                        <div className="truncate font-display text-base font-bold tracking-tight text-[#111827] sm:text-lg">
                          {partner.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs font-medium text-slate-500 sm:text-sm">
                          {partner.category}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
