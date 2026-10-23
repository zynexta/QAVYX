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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-3.5 xl:gap-4 justify-items-center">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="group relative flex flex-col justify-end w-full max-w-[230px] h-[370px] xs:h-[400px] sm:h-[430px] lg:h-[460px]"
            >
              {/* Green Pillar Card Body matching reference: heavy rounded top-left, square top-right */}
              <div className="absolute inset-0 rounded-tl-[44px] xs:rounded-tl-[52px] sm:rounded-tl-[60px] rounded-tr-[4px] rounded-b-[4px] bg-gradient-to-b from-[#2ABD00] via-[#1a7a0e] to-[#072403] overflow-hidden shadow-[0_10px_30px_rgba(42,189,0,0.18)] transition-all duration-300 group-hover:shadow-[0_14px_45px_rgba(42,189,0,0.38)]">
                {/* Vertical Outlined "Directors" Watermark on the LEFT side */}
                <span
                  aria-hidden="true"
                  className="absolute -left-6 xs:-left-5 sm:-left-4 top-[32%] -translate-y-1/2 -rotate-90 origin-center text-3xl xs:text-4xl sm:text-[42px] font-black uppercase tracking-[0.2em] pointer-events-none select-none whitespace-nowrap opacity-25"
                  style={{
                    WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.9)',
                    color: 'transparent',
                  }}
                >
                  Directors
                </span>

                {/* Subtle top-right ambient light */}
                <div
                  aria-hidden="true"
                  className="absolute -top-12 -right-12 w-32 h-32 bg-[#86ff66]/15 rounded-full blur-xl pointer-events-none"
                />

                {/* Dark Gradient Overlay at Bottom for text legibility */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/85 to-transparent z-10 pointer-events-none"
                />
              </div>

              {/* Team Member Cutout with ample headroom */}
              <div className="relative z-20 w-full h-[84%] flex items-end justify-center pointer-events-none pb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-contain object-bottom transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"
                  loading="eager"
                />
              </div>

              {/* Name & Role Content at the Bottom */}
              <div className="relative z-30 px-3.5 pb-3.5 pt-1 text-left">
                <h3 className="text-base sm:text-lg font-bold text-white font-sans leading-tight tracking-tight group-hover:text-[#2ABD00] transition-colors">
                  {member.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/75 font-sans leading-tight mt-0.5 font-normal">
                  {member.role}
                </p>
                <a
                  href={`mailto:${member.email}`}
                  className="inline-block text-[10px] sm:text-[11px] text-[#2ABD00] hover:text-[#86ff66] font-sans leading-tight mt-1 hover:underline transition-colors"
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
