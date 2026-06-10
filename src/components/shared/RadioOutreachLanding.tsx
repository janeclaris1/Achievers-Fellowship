import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Play,
  Radio,
  X,
} from 'lucide-react';
import {
  RADIO_OUTREACH_PREVIOUS_PROGRAMS,
  RADIO_PROGRAM_THUMBNAIL,
  type RadioPreviousProgram,
} from '../../lib/departmentPrograms';
import { cn } from '../../utils/cn';

interface RadioOutreachLandingProps {
  basePath: string;
}

function SocialIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span className="text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" aria-hidden>
      {children}
      <span className="sr-only">{label}</span>
    </span>
  );
}

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <SocialIcon label="Facebook">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </SocialIcon>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com',
    icon: (
      <SocialIcon label="X">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </SocialIcon>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <SocialIcon label="Instagram">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      </SocialIcon>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <SocialIcon label="LinkedIn">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </SocialIcon>
    ),
  },
];

const RadioOutreachLanding: React.FC<RadioOutreachLandingProps> = ({ basePath }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingProgram, setPlayingProgram] = useState<RadioPreviousProgram | null>(null);

  const handlePlay = (program: RadioPreviousProgram) => {
    if (program.mediaUrl) {
      window.open(program.mediaUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setPlayingProgram(program);
  };

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setSubscribed(true);
    setSubmitting(false);
    setEmail('');
  };

  return (
    <div className="fade-in -mx-4 lg:-mx-6">
      <div className="px-4 lg:px-6 mb-4">
        <Link
          to={basePath}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft size={16} /> All departments
        </Link>
      </div>

      <section className="overflow-hidden rounded-none lg:rounded-[12px] border-y lg:border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="grid lg:grid-cols-2 min-h-[520px] lg:min-h-[640px]">
          <div className="relative min-h-[280px] lg:min-h-full bg-slate-900">
            <img
              src="/departments/radio-outreach-hero.png"
              alt="Radio studio mixing console"
              className="absolute inset-0 h-full w-full object-cover object-left"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/10 to-slate-900/30 lg:to-white/0 dark:to-slate-900/0" />
            <div className="absolute bottom-6 left-6 right-6 lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                <Radio size={14} />
                Radio Outreach
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Radio Outreach at Christ Embassy Achievers PCF
            </h1>

            <div className="mt-6 text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                The Radio Outreach at Christ Embassy Achievers PCF is a dedicated fellowship media
                initiative. Our mission is to share the gospel of our Lord and Savior to the absolute
                ends of the earth.
              </p>
            </div>

            <div className="mt-10">
              <h2 className="text-base font-heading font-bold text-slate-900 dark:text-slate-100">
                Stay Connected with Our Community
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Sign up today to receive exclusive updates on our upcoming live events and broadcasts.
              </p>

              {subscribed ? (
                <div className="mt-5 flex items-start gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                  <span>Thank you. You&apos;re subscribed to Radio Outreach updates.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-5 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-0 sm:gap-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email here*"
                      className="flex-1 rounded-[8px] sm:rounded-r-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 sm:mt-0 rounded-[8px] sm:rounded-l-none bg-rose-600 hover:bg-rose-700 disabled:opacity-70 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                      Subscribe
                    </button>
                  </div>
                  {error ? <p className="text-xs text-rose-600">{error}</p> : null}
                </form>
              )}

              <div className="mt-8 flex items-center gap-4">
                {socialLinks.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="inline-flex"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 px-4 lg:px-6 pb-4">
        <div className="mb-6">
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">
            Previous Program Highlights
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Highlights from nine recent Radio Outreach broadcasts and live sessions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {RADIO_OUTREACH_PREVIOUS_PROGRAMS.map((program, index) => (
            <article key={program.id} className="card overflow-hidden flex flex-col h-full">
              <div className="relative aspect-video overflow-hidden bg-slate-900 group">
                <img
                  src={program.thumbnailImage ?? RADIO_PROGRAM_THUMBNAIL}
                  alt={`${program.title} — Achievers Radio studio hosts`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-slate-900/10" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-white/90 px-2 text-xs font-bold text-violet-700">
                    {index + 1}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handlePlay(program)}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
                  >
                    <Play size={16} className="fill-current" />
                    Play Now
                  </button>
                </div>
              </div>
              <div className={cn('h-1 bg-gradient-to-r', program.gradient)} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-heading font-semibold text-slate-900 dark:text-slate-100">
                    {program.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {program.airedOn}
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">{program.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {playingProgram && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPlayingProgram(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-[12px] bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPlayingProgram(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="relative aspect-video bg-slate-900">
              <img
                src={playingProgram.thumbnailImage ?? RADIO_PROGRAM_THUMBNAIL}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 text-white px-6 text-center">
                <Play size={40} className="mb-3 fill-current opacity-90" />
                <p className="font-heading font-semibold">{playingProgram.title}</p>
                <p className="mt-2 text-sm text-white/80">
                  Broadcast replay will be available here soon.
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-300">{playingProgram.summary}</p>
              <button
                type="button"
                onClick={() => setPlayingProgram(null)}
                className="mt-4 w-full rounded-[8px] bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadioOutreachLanding;
