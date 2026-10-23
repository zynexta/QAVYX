import React from 'react';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  image: string;
  borderRadius: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Zack Hill',
    role: 'Partner & CEO',
    email: 'zack@qavyx.com',
    image: '/images/team/team_zack.webp',
    borderRadius: '60% 40% 55% 45% / 55% 45% 60% 40%',
  },
  {
    id: '2',
    name: 'Arlton Lowry',
    role: 'Partner & CCO',
    email: 'arlton@qavyx.com',
    image: '/images/team/team_arlton.webp',
    borderRadius: '45% 55% 40% 60% / 60% 40% 55% 45%',
  },
  {
    id: '3',
    name: 'Sarah Devine',
    role: 'Director of Projects',
    email: 'sarah@qavyx.com',
    image: '/images/team/team_sarah.webp',
    borderRadius: '52% 48% 62% 38% / 48% 58% 42% 52%',
  },
  {
    id: '4',
    name: 'Will Carter',
    role: 'Director of Accounts',
    email: 'will@qavyx.com',
    image: '/images/team/team_will.webp',
    borderRadius: '40% 60% 50% 50% / 55% 45% 60% 40%',
  },
  {
    id: '5',
    name: 'Calvin Bramlett',
    role: 'Creative & Design Director',
    email: 'calvin@qavyx.com',
    image: '/images/team/team_calvin.webp',
    borderRadius: '55% 45% 65% 35% / 42% 58% 45% 55%',
  },
  {
    id: '6',
    name: 'Marcus Hayes',
    role: 'Performance & Media Lead',
    email: 'marcus@qavyx.com',
    image: '/images/team/team_marcus.webp',
    borderRadius: '48% 52% 40% 60% / 58% 42% 55% 45%',
  },
  {
    id: '7',
    name: 'Correne Spero',
    role: 'Finance & Operations',
    email: 'correne@qavyx.com',
    image: '/images/team/team_correne.webp',
    borderRadius: '62% 38% 50% 50% / 45% 55% 40% 60%',
  },
  {
    id: '8',
    name: 'John Cater',
    role: 'Strategy & Automation Lead',
    email: 'john@qavyx.com',
    image: '/images/team/team_john.webp',
    borderRadius: '42% 58% 55% 45% / 50% 50% 58% 42%',
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
        {/* Header: Our Team with #2ABD00 highlight */}
        <div className="mb-12 sm:mb-16 text-left">
          <h2
            id="qx-team-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-sans"
          >
            Our <span className="text-[#2ABD00]">Team</span>
          </h2>
        </div>

        {/* 4-Column Responsive Grid matching reference */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 sm:gap-y-14 gap-x-6 sm:gap-x-10 lg:gap-x-8 justify-items-center">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="group flex flex-col items-center text-center w-full max-w-[220px]"
            >
              {/* Photo Area with Organic Fluid Green Blob behind */}
              <div className="relative w-[150px] h-[175px] xs:w-[165px] xs:h-[190px] sm:w-[185px] sm:h-[215px] flex items-end justify-center mb-4">
                {/* Organic Green Fluid Blob */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 top-2 bottom-1 bg-gradient-to-br from-[#2ABD00] to-[#125807] shadow-[0_0_28px_rgba(42,189,0,0.35)] transition-all duration-500 group-hover:scale-105 group-hover:rotate-1"
                  style={{
                    borderRadius: member.borderRadius,
                  }}
                />

                {/* Team Member Transparent Half-Body Cutout Photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="relative z-10 w-full h-full object-contain object-bottom transition-transform duration-300 group-hover:scale-[1.03]"
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
