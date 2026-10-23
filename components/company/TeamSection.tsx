import React from 'react';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  image: string;
  borderRadius: string;
  blobGradient: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Zack Hill',
    role: 'Founder & CEO',
    email: 'zack@qavyx.com',
    image: '/images/afnan.webp',
    borderRadius: '62% 38% 42% 58% / 54% 35% 65% 46%',
    blobGradient: 'from-[#2ABD00] via-[#1a7a0e] to-[#0c3806]',
  },
  {
    id: '2',
    name: 'Will Carter',
    role: 'Head of Growth Marketing',
    email: 'will@qavyx.com',
    image: '/images/shaheed.webp',
    borderRadius: '45% 55% 62% 38% / 40% 60% 40% 60%',
    blobGradient: 'from-[#23a200] via-[#16680d] to-[#092a05]',
  },
  {
    id: '3',
    name: 'Arlton Lowry',
    role: 'Partner & Strategy Lead',
    email: 'arlton@qavyx.com',
    image: '/images/hashir.webp',
    borderRadius: '58% 42% 36% 64% / 65% 45% 55% 35%',
    blobGradient: 'from-[#2ABD00] via-[#1a7a0e] to-[#0d3f07]',
  },
  {
    id: '4',
    name: 'Calvin Bramlett',
    role: 'Creative & Design Director',
    email: 'calvin@qavyx.com',
    image: '/images/shijil.webp',
    borderRadius: '40% 60% 55% 45% / 48% 58% 42% 52%',
    blobGradient: 'from-[#28b300] via-[#18720e] to-[#0a2e05]',
  },
  {
    id: '5',
    name: 'Marcus Hayes',
    role: 'Performance & Media Lead',
    email: 'marcus@qavyx.com',
    image: '/images/anas.webp',
    borderRadius: '52% 48% 65% 35% / 42% 55% 45% 58%',
    blobGradient: 'from-[#2ABD00] via-[#1a7a0e] to-[#0c3806]',
  },
];

export function TeamSection() {
  return (
    <section
      id="qx-team-showcase"
      aria-labelledby="qx-team-heading"
      className="relative w-full py-10 sm:py-14 md:py-18 select-none overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#2ABD00]/[0.03] blur-[150px] rounded-full"
      />

      <div className="mx-auto max-w-[var(--qx-shell)] px-3 sm:px-6">
        {/* Header: Our Team with green accent, no 'WHO WE ARE' tag */}
        <div className="mb-10 sm:mb-14 text-left">
          <h2
            id="qx-team-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-sans"
          >
            Our <span className="text-[#2ABD00]">Team</span>
          </h2>
        </div>

        {/* 5-Column Responsive Grid matching reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-6 sm:gap-x-8 lg:gap-x-6 justify-items-center">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="group flex flex-col items-center text-center w-full max-w-[190px]"
            >
              {/* Photo with Organic Green Blob Background */}
              <div className="relative w-[140px] h-[165px] xs:w-[155px] xs:h-[185px] sm:w-[170px] sm:h-[200px] flex items-end justify-center mb-3.5">
                {/* Organic Green Fluid Blob */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-2 top-3 bottom-2 bg-gradient-to-br ${member.blobGradient} transition-all duration-500 group-hover:scale-105 group-hover:rotate-2 shadow-[0_0_26px_rgba(42,189,0,0.32)]`}
                  style={{
                    borderRadius: member.borderRadius,
                  }}
                />

                {/* Team Member Cutout Photo (Transparent WebP with monochrome-to-color hover) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="relative z-10 w-full h-full object-contain object-bottom grayscale contrast-115 group-hover:grayscale-0 transition-all duration-300 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                  loading="eager"
                />
              </div>

              {/* Digital Marketing Agency Role */}
              <p className="text-[11px] sm:text-xs font-sans text-[#919A94] mb-0.5 leading-tight">
                {member.role}
              </p>

              {/* Name */}
              <h3 className="text-base sm:text-lg font-bold text-white font-sans leading-tight mb-1 group-hover:text-[#2ABD00] transition-colors">
                {member.name}
              </h3>

              {/* Email */}
              <a
                href={`mailto:${member.email}`}
                className="text-xs sm:text-[13px] font-sans font-medium text-[#2ABD00] hover:text-[#86ff66] hover:underline transition-colors leading-tight"
              >
                {member.email}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
