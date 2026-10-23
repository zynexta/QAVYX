import React from 'react';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  image: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Zack Hill',
    role: 'Founder & CEO',
    email: 'zack@qavyx.com',
    image: '/images/team/team_zack.webp',
  },
  {
    id: '2',
    name: 'Arlton Lowry',
    role: 'Partner & CCO',
    email: 'arlton@qavyx.com',
    image: '/images/team/team_arlton.webp',
  },
  {
    id: '3',
    name: 'Sarah Devine',
    role: 'Director of Projects',
    email: 'sarah@qavyx.com',
    image: '/images/team/team_sarah.webp',
  },
  {
    id: '4',
    name: 'Will Carter',
    role: 'Director of Accounts',
    email: 'will@qavyx.com',
    image: '/images/team/team_will.webp',
  },
  {
    id: '5',
    name: 'Calvin Bramlett',
    role: 'Creative & Design Director',
    email: 'calvin@qavyx.com',
    image: '/images/team/team_calvin.webp',
  },
];

export function TeamSection() {
  return (
    <section
      id="qx-team-showcase"
      aria-labelledby="qx-team-heading"
      className="relative w-full py-12 sm:py-16 md:py-20 bg-black select-none overflow-hidden"
    >
      <div className="mx-auto max-w-[var(--qx-shell)] px-3 sm:px-6">
        {/* Header: Our Team */}
        <div className="mb-10 sm:mb-14 text-left">
          <h2
            id="qx-team-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-sans"
          >
            Our <span className="text-[#2ABD00]">Team</span>
          </h2>
        </div>

        {/* 5 Cards in a Single Row matching the reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-3.5 xl:gap-4 justify-items-center">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="group relative flex flex-col justify-end w-full max-w-[230px] h-[340px] xs:h-[365px] sm:h-[390px] lg:h-[410px]"
            >
              {/* Left Half Green Pillar (cut in half to ~52% width, matching reference) */}
              <div className="absolute left-0 top-0 bottom-0 w-[52%] sm:w-[54%] rounded-tl-[40px] xs:rounded-tl-[48px] sm:rounded-tl-[54px] rounded-tr-none rounded-b-none bg-gradient-to-b from-[#2ABD00] via-[#1a7a0e] to-[#072403] overflow-hidden shadow-[0_8px_25px_rgba(42,189,0,0.2)] transition-all duration-300 group-hover:shadow-[0_12px_35px_rgba(42,189,0,0.4)]">
                {/* Vertical Outlined "Directors" Watermark Text on the Left Green Half */}
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center text-2xl xs:text-3xl sm:text-[34px] font-black uppercase tracking-[0.2em] pointer-events-none select-none whitespace-nowrap opacity-30"
                  style={{
                    WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.95)',
                    color: 'transparent',
                  }}
                >
                  Directors
                </span>

                {/* Subtle top ambient light on the green strip */}
                <div
                  aria-hidden="true"
                  className="absolute -top-8 -left-8 w-24 h-24 bg-[#86ff66]/20 rounded-full blur-lg pointer-events-none"
                />

                {/* Bottom dark gradient fade for text legibility */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/85 to-transparent z-10 pointer-events-none"
                />
              </div>

              {/* Bottom full-width dark gradient for legible text across both halves */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent z-15 pointer-events-none"
              />

              {/* Team Member Cutout (Enlarged character prominently filling card, breaking out of green strip) */}
              <div className="relative z-20 w-full h-[90%] sm:h-[92%] flex items-end justify-center pointer-events-none pb-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-contain object-bottom scale-115 sm:scale-120 transition-transform duration-300 group-hover:scale-[1.25] drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                  loading="eager"
                />
              </div>

              {/* Name & Role Content at the Bottom */}
              <div className="relative z-30 px-2.5 sm:px-3 pb-3 pt-1 text-left">
                <h3 className="text-base sm:text-lg font-bold text-white font-sans leading-tight tracking-tight group-hover:text-[#2ABD00] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {member.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/80 font-sans leading-tight mt-0.5 font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {member.role}
                </p>
                <a
                  href={`mailto:${member.email}`}
                  className="inline-block text-[10px] sm:text-[11px] text-[#2ABD00] hover:text-[#86ff66] font-sans leading-tight mt-1 hover:underline transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  {member.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
