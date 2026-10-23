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
    image: '/images/afnan.webp',
  },
  {
    id: '2',
    name: 'Will Carter',
    role: 'Head of Growth Marketing',
    email: 'will@qavyx.com',
    image: '/images/shaheed.webp',
  },
  {
    id: '3',
    name: 'Arlton Lowry',
    role: 'Partner & Strategy Lead',
    email: 'arlton@qavyx.com',
    image: '/images/hashir.webp',
  },
  {
    id: '4',
    name: 'Calvin Bramlett',
    role: 'Creative & Design Director',
    email: 'calvin@qavyx.com',
    image: '/images/shijil.webp',
  },
  {
    id: '5',
    name: 'Marcus Hayes',
    role: 'Performance & Media Lead',
    email: 'marcus@qavyx.com',
    image: '/images/anas.webp',
  },
];

export function TeamSection() {
  return (
    <section
      id="qx-team-showcase"
      aria-labelledby="qx-team-heading"
      className="relative w-full py-10 sm:py-14 md:py-18 bg-black select-none overflow-hidden"
    >
      <div className="mx-auto max-w-[var(--qx-shell)] px-3 sm:px-6">
        {/* Header: Our Team with #2ABD00 highlight */}
        <div className="mb-10 sm:mb-14 text-left">
          <h2
            id="qx-team-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-sans"
          >
            Our <span className="text-[#2ABD00]">Team</span>
          </h2>
        </div>

        {/* 5-Column Responsive Grid matching reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-4 sm:gap-x-6 lg:gap-x-4 justify-items-center">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="group flex flex-col items-center text-center w-full max-w-[200px]"
            >
              {/* Photo Area with Circular Green Glowing Aura behind */}
              <div className="relative w-full h-[210px] sm:h-[230px] flex items-end justify-center mb-4">
                {/* Green Glowing Circle Accent peeking out from the sides */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] sm:w-[175px] sm:h-[175px] rounded-full bg-gradient-to-r from-[#2ABD00] via-[#1a7a0e] to-[#0c3806] shadow-[0_0_35px_rgba(42,189,0,0.35)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_45px_rgba(42,189,0,0.55)]"
                />

                {/* Team Member Photo (Seamless Black Background) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="relative z-10 w-[140px] sm:w-[155px] h-full object-contain object-bottom transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="eager"
                />
              </div>

              {/* Role */}
              <p className="text-[11px] sm:text-xs font-sans text-[#919A94] mb-1 leading-tight">
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
