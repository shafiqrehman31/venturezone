import { useState } from 'react';
import { ArrowUpRight, FileDown, Loader2, MessageCircle } from 'lucide-react';
import { downloadProposalBooklet } from '../lib/downloadBooklet';
import type { CmsLandingConfig, NavMenuItem } from '../types/domain';
import { LEGAL_PAGE_LINKS } from './LegalPages';

interface SiteFooterProps {
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  navItems: NavMenuItem[];
  onNavigate: (slug: string) => void;
}

export function SiteFooter({
  cms,
  navItems,
  onNavigate,
}: SiteFooterProps) {
  const [downloadingBooklet, setDownloadingBooklet] = useState(false);
  const rawSite = cms.siteName?.trim();
  const brandName = !rawSite || rawSite === 'Meridian Setup' ? 'venturezoneuae.com' : rawSite;
  const cleanWaDigits = cms.whatsappNumber.replace(/[^\d]/g, '');
  const visibleNav = navItems.filter((n) => n.visible).sort((a, b) => a.order - b.order);

  async function handleBookletDownload() {
    if (downloadingBooklet) return;
    setDownloadingBooklet(true);
    try {
      await downloadProposalBooklet();
    } finally {
      setDownloadingBooklet(false);
    }
  }

  const socialLinks = [
    {
      name: 'LinkedIn',
      url: cms.socialLinkedin?.trim(),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: cms.socialInstagram?.trim(),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      name: 'X',
      url: cms.socialX?.trim(),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      url: cms.socialYoutube?.trim(),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      url: cms.socialFacebook?.trim(),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
        </svg>
      ),
    },
  ].filter((s) => Boolean(s.url));

  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-[#0B0F17] text-slate-200">
      {/* Subtle Spatial Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#ff0031]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#00b294]/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand / Uploaded Logo & Social Media Links */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-white">
              <img
                src={cms.footerLogoDataUrl || '/assets/aistudio/Venture-Zone-Logos-white_949ee09f.png'}
                alt={brandName}
                className="h-11 sm:h-[50px] w-auto object-contain [image-rendering:-webkit-optimize-contrast]"
              />
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              Corporate formation, investor visa processing, and UAE business banking advisory for
              international founders launching in Dubai Free Zones and Mainland.
            </p>

            {/* Social Media Links (hidden for now; ready for future activation) */}
            {false && socialLinks.length > 0 && (
              <div className="mt-5">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Connect With Us
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      title={social.name}
                      className="spatial-glass-dark flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-[#00b294]/50 hover:bg-white/15 hover:text-white"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Dynamic Site Navigation */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold text-white">Navigation</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              {visibleNav.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.slug)}
                    className="text-left transition-colors hover:text-[#00b294]"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Formation Tools */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-bold text-white">Formation Tools</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('home');
                    setTimeout(() => {
                      document.getElementById('cost-calculator')?.scrollIntoView({ behavior: 'smooth' });
                    }, 60);
                  }}
                  className="transition-colors hover:text-[#00b294]"
                >
                  Instant Cost Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('home');
                    setTimeout(() => {
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }, 60);
                  }}
                  className="transition-colors hover:text-[#00b294]"
                >
                  Transparent AED Packages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('home');
                    setTimeout(() => {
                      document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' });
                    }, 60);
                  }}
                  className="transition-colors hover:text-[#00b294]"
                >
                  Live Progress Tracker
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('guides')}
                  className="transition-colors hover:text-[#00b294]"
                >
                  Book Free Consultation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  disabled={downloadingBooklet}
                  onClick={handleBookletDownload}
                  className="inline-flex items-center gap-1.5 font-medium text-[#00b294] transition-colors hover:text-[#2DD4BF] disabled:opacity-60"
                >
                  {downloadingBooklet ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5" />
                  )}
                  <span>{downloadingBooklet ? 'Preparing PDF...' : 'Proposal Booklet (PDF)'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Direct WhatsApp Desk */}
          <div className="lg:col-span-3">
            <div className="spatial-glass-dark rounded-2xl p-5">
              <h3 className="font-display text-sm font-bold text-white">Direct WhatsApp Desk</h3>
              <p className="mt-1.5 text-xs text-slate-300">
                Mon–Sat · 09:00–19:00 GST (Dubai)
              </p>

              <div className="mt-4 space-y-2.5">
                <a
                  href={`https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
                    `Hello ${brandName}, I would like to speak with a Dubai formation advisor.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#00b294] px-4 text-xs font-bold text-white transition-colors hover:bg-[#00967C]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  disabled={downloadingBooklet}
                  onClick={handleBookletDownload}
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white transition-colors hover:border-[#ff0031]/50 hover:bg-white/10 disabled:opacity-60"
                >
                  {downloadingBooklet ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff0031]" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 text-[#ff0031]" />
                  )}
                  <span>{downloadingBooklet ? 'Preparing PDF...' : 'Download Booklet PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Compliance Row (Admin Portal hidden from footer; accessed via /#admin) */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} {brandName} Corporate Services LLC · Registered in
            Dubai, UAE.
          </div>
          <nav aria-label="Legal pages" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_PAGE_LINKS.map((legal) => (
              <button
                key={legal.slug}
                type="button"
                onClick={() => onNavigate(legal.slug)}
                className="transition-colors hover:text-white"
              >
                {legal.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
