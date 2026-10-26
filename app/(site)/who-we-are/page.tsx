import type { Metadata } from 'next';
import Image from 'next/image';
import { EYEBROW } from '@/components/inner/InnerPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { TeamSection } from '@/components/company/TeamSection';
import {
  ABOUT,
  MISSION,
  TEAM,
  VISION,
  WHO_WE_ARE,
} from '@/content/company';
import { reveal, stagger } from '@/lib/reveal';
import { pageJsonLd, pageMetadata } from '@/lib/seo';

const PAGE = { href: '/who-we-are', label: WHO_WE_ARE.heading };
const DESCRIPTION = ABOUT.description.join(' ');

export const metadata: Metadata = pageMetadata({
  path: '/who-we-are',
  title: WHO_WE_ARE.heading,
  description: DESCRIPTION,
});

export default function WhoWeAreRoute() {
  return (
    <>
      <JsonLd data={pageJsonLd({ page: PAGE, description: DESCRIPTION, type: 'AboutPage' })} />

      <main className="bg-qx-black selection:bg-[#2ABD00] selection:text-black">
        <article className="mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
          
          {/* ==============================================================
              HERO / INTRO SECTION: We're Not an Agency. We're Your Growth Team.
              ============================================================== */}
          <div {...reveal} className="relative w-full">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-10 left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(42,189,0,0.12)_0%,rgba(26,122,14,0.03)_50%,transparent_75%)] blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Typography, Taglines & Copy */}
              <div data-rv style={stagger(0)} className="lg:col-span-7 flex flex-col items-start z-10">
                {/* Main Accessible Heading */}
                <h1 className="qx-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.1rem] font-bold tracking-tight text-white leading-[1.12] mb-4 sm:mb-5">
                  <span>We&apos;re Not an Agency. </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ABD00] via-[#52e825] to-[#2ABD00]">
                    We&apos;re Your Growth Team.
                  </span>
                </h1>

                {/* Lead Sentence */}
                <p className="text-sm sm:text-base text-white/95 font-semibold leading-relaxed font-sans mb-3 sm:mb-4 max-w-[580px]">
                  {ABOUT.description[0]}
                </p>

                {/* Narrative Details */}
                <div className="flex flex-col gap-2.5 mb-6 max-w-[580px]">
                  <p className="text-xs sm:text-sm text-[#919A94] font-medium leading-relaxed font-sans">
                    {ABOUT.description[1]}
                  </p>
                  <p className="text-xs sm:text-sm text-[#919A94] font-medium leading-relaxed font-sans">
                    {ABOUT.description[2]}
                  </p>
                  <p className="text-xs sm:text-sm text-[#919A94] font-medium leading-relaxed font-sans">
                    {ABOUT.description[3]}
                  </p>
                </div>

                {/* Capabilities Feature Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 w-full max-w-[580px]">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-black/60 backdrop-blur-sm text-[11px] text-white/90 font-sans shadow-sm hover:border-[#2ABD00]/40 transition-colors">
                    <span className="text-[#2ABD00] font-bold">✓</span> One Unified Team
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-black/60 backdrop-blur-sm text-[11px] text-white/90 font-sans shadow-sm hover:border-[#2ABD00]/40 transition-colors">
                    <span className="text-[#2ABD00] font-bold">✓</span> AI Automation
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-black/60 backdrop-blur-sm text-[11px] text-white/90 font-sans shadow-sm hover:border-[#2ABD00]/40 transition-colors">
                    <span className="text-[#2ABD00] font-bold">✓</span> Measurable Growth
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-black/60 backdrop-blur-sm text-[11px] text-white/90 font-sans shadow-sm hover:border-[#2ABD00]/40 transition-colors">
                    <span className="text-[#2ABD00] font-bold">✓</span> Fast Execution
                  </div>
                </div>
              </div>

              {/* Right Column: High-Tech Visual Graphic */}
              <div data-rv style={stagger(1)} className="lg:col-span-5 flex items-center justify-center lg:justify-end w-full">
                <div className="relative w-full max-w-[480px] lg:max-w-[440px] xl:max-w-[480px]">
                  
                  {/* Outer Ambient Green Glow behind image */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="h-[260px] w-[260px] sm:h-[340px] sm:w-[340px] rounded-full bg-[radial-gradient(circle_at_center,rgba(42,189,0,0.25)_0%,rgba(26,122,14,0.08)_50%,transparent_75%)] blur-2xl" />
                  </div>

                  {/* Main Frame with Glassmorphic Border */}
                  <div className="relative group overflow-visible rounded-2xl border border-white/15 bg-gradient-to-b from-[#06180a]/90 via-[#020b04]/95 to-[#010602] p-2.5 sm:p-3 backdrop-blur-xl shadow-[0_16px_45px_rgba(0,0,0,0.9),0_0_25px_rgba(42,189,0,0.18)] transition-all duration-500 hover:border-[#2ABD00]/70 hover:shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_35px_rgba(42,189,0,0.35)]">
                    
                    {/* Glowing Tech Corners */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#2ABD00] rounded-tl-sm pointer-events-none" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#2ABD00] rounded-tr-sm pointer-events-none" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#2ABD00] rounded-bl-sm pointer-events-none" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#2ABD00] rounded-br-sm pointer-events-none" />

                    {/* Top Edge Glow */}
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#2ABD00]/80 to-transparent" />

                    {/* Image Container with Inner Vignette */}
                    <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3]">
                      <Image
                        src="/images/who-we-are-hero.jpg"
                        alt="QAVYX Growth Team Holographic Digital Workspace"
                        width={720}
                        height={540}
                        priority
                        className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {/* Vignette Gradients */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
                    </div>

                    {/* Floating Tech Badge 2 (Bottom-Left: Reach & Impact) */}
                    <div className="absolute -bottom-3 -left-2 sm:-left-4 z-20 flex items-center gap-2.5 rounded-lg border border-white/20 bg-black/95 px-3 py-1.5 backdrop-blur-md shadow-[0_6px_22px_rgba(0,0,0,0.95)] transition-transform duration-300 hover:scale-105">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2ABD00]/20 text-[#2ABD00]">
                        <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-[#919A94]">Reach & Impact</span>
                        <span className="font-sans text-[10px] sm:text-[11px] font-bold text-white leading-tight">
                          India, GCC & Beyond
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ==============================================================
              SECTION 2: SLANTED DUAL-CARD COMPOSITION (OUR MISSION & OUR VISION)
              Matching User Reference Design - Perfectly Aligned, Separate, Unclipped
              ============================================================== */}
          <div {...reveal} className="relative mt-8 sm:mt-12 md:mt-16 w-full flex justify-center">
            {/* Ambient Background Glow Behind Cards */}
            <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-[720px] h-[280px] bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.14)_0%,transparent_70%)] blur-3xl" />

            {/* Container for the Dual Cards */}
            <div className="relative w-full max-w-[1080px]">
              
              {/* Desktop Coordinated SVG Background Frame (Both Cards Clearly Separate with Parallel Diagonal Gap) */}
              <svg
                viewBox="0 0 1000 300"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="hidden md:block absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_16px_45px_rgba(0,0,0,0.85)]"
              >
                <defs>
                  <linearGradient id="mission-card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#092610" stopOpacity="0.92" />
                    <stop offset="45%" stopColor="#041407" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#010602" stopOpacity="0.98" />
                  </linearGradient>
                  <linearGradient id="vision-card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#092610" stopOpacity="0.92" />
                    <stop offset="45%" stopColor="#041407" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#010602" stopOpacity="0.98" />
                  </linearGradient>
                </defs>

                {/* Card 1: Our Mission */}
                <path
                  d="M 24,4 L 508,4 Q 522,4 518,18 L 458,282 Q 454,296 440,296 L 24,296 Q 4,296 4,276 L 4,24 Q 4,4 24,4 Z"
                  fill="url(#mission-card-bg)"
                  stroke="#2ABD00"
                  strokeWidth="1.5"
                  strokeOpacity="0.75"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Card 2: Our Vision */}
                <path
                  d="M 554,4 L 976,4 Q 996,4 996,24 L 996,276 Q 996,296 976,296 L 494,296 Q 480,296 476,282 L 536,18 Q 540,4 554,4 Z"
                  fill="url(#vision-card-bg)"
                  stroke="#2ABD00"
                  strokeWidth="1.5"
                  strokeOpacity="0.75"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Cards Content Grid */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 w-full items-stretch">
                
                {/* ---------------- CARD 1: OUR MISSION ---------------- */}
                <section
                  aria-labelledby="mission-heading"
                  data-rv
                  style={stagger(0)}
                  className="relative flex flex-col justify-between p-6 sm:p-7 md:py-8 md:pl-8 md:pr-14 lg:py-9 lg:pl-10 lg:pr-20 min-h-[240px] sm:min-h-[260px] md:min-h-[280px]"
                >
                  {/* Mobile Glassmorphic Frame */}
                  <div
                    aria-hidden="true"
                    className="md:hidden absolute inset-0 rounded-2xl border border-[#2ABD00]/70 bg-gradient-to-b from-[#092610]/95 via-[#041407]/95 to-[#010602]/98 shadow-[0_12px_36px_rgba(0,0,0,0.85)] pointer-events-none"
                  />

                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      {/* Header: Label + Green Bar */}
                      <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                        <h2
                          id="mission-heading"
                          className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/90 font-medium"
                        >
                          {MISSION.heading}
                        </h2>
                        <span className="w-7 sm:w-8 h-[2px] bg-[#2ABD00] rounded-full inline-block" />
                      </div>

                      {/* Bold Headline matching reference */}
                      <h3 className="text-lg sm:text-xl md:text-[21px] lg:text-[24px] xl:text-[26px] font-extrabold text-white leading-[1.18] tracking-tight mb-2.5 sm:mb-3 max-w-[420px]">
                        <span>Empowering </span>
                        <br />
                        <span className="text-[#2ABD00]">Scalable Business </span>
                        <br />
                        <span>Acceleration.</span>
                      </h3>

                      {/* Official Client Copy */}
                      <p className="text-xs sm:text-[13px] lg:text-[13.5px] text-[#919A94] font-medium leading-relaxed font-sans max-w-[370px]">
                        {MISSION.copy}
                      </p>
                    </div>
                  </div>
                </section>

                {/* ---------------- CARD 2: OUR VISION ---------------- */}
                <section
                  aria-labelledby="vision-heading"
                  data-rv
                  style={stagger(1)}
                  className="relative flex flex-col justify-between p-6 sm:p-7 md:py-8 md:pr-8 md:pl-16 lg:py-9 lg:pr-10 lg:pl-20 min-h-[240px] sm:min-h-[260px] md:min-h-[280px]"
                >
                  {/* Mobile Glassmorphic Frame */}
                  <div
                    aria-hidden="true"
                    className="md:hidden absolute inset-0 rounded-2xl border border-[#2ABD00]/70 bg-gradient-to-b from-[#092610]/95 via-[#041407]/95 to-[#010602]/98 shadow-[0_12px_36px_rgba(0,0,0,0.85)] pointer-events-none"
                  />

                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      {/* Header: Label + Green Bar */}
                      <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                        <h2
                          id="vision-heading"
                          className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/90 font-medium"
                        >
                          {VISION.heading}
                        </h2>
                        <span className="w-7 sm:w-8 h-[2px] bg-[#2ABD00] rounded-full inline-block" />
                      </div>

                      {/* Bold Headline matching reference */}
                      <h3 className="text-lg sm:text-xl md:text-[21px] lg:text-[24px] xl:text-[26px] font-extrabold text-white leading-[1.18] tracking-tight mb-2.5 sm:mb-3 max-w-[420px]">
                        <span>The Trusted </span>
                        <br />
                        <span>Benchmark For </span>
                        <br />
                        <span className="text-[#2ABD00]">Enterprise Growth.</span>
                      </h3>

                      {/* Official Client Copy */}
                      <p className="text-xs sm:text-[13px] lg:text-[13.5px] text-[#919A94] font-medium leading-relaxed font-sans max-w-[370px]">
                        {VISION.copy}
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </div>

          {/*
            THE PROFILE GRID — commented out because no profiles have been
            supplied. It is written against §50's own suggested fields
            (`TEAM_PROFILE_FIELDS` in `content/company.ts`), so real profiles
            drop into it without a redesign. Uncomment it and fill
            `TEAM.profiles` in the same commit; `tests/unit/company-content.test.ts`
            fails if the second happens without the first.

            <ul className="mt-6 grid gap-6 border-t border-qx-line pt-6 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.profiles.map((profile) => (
                <li key={profile.name} className="flex flex-col gap-3">
                  <Image
                    src={profile.image}
                    alt=""
                    width={480}
                    height={480}
                    className="aspect-square w-full rounded-sm border border-qx-line object-cover"
                  />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg text-qx-white">{profile.name}</h3>
                    <p className={EYEBROW}>{profile.role}</p>
                  </div>
                  <p className="max-w-[42ch] text-sm text-qx-grey">{profile.bio}</p>
                </li>
              ))}
            </ul>
          */}
        </article>
      </main>

      {/* Dynamic 3D Team Member Showcase Carousel (Left Completely Untouched as Requested) */}
      <TeamSection />
    </>
  );
}
