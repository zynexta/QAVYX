/**
 * The growth story.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` —
 * §5 The Problem, §6 The Solution, §7 Our Growth Framework.
 *
 * It replaced a Word draft that has since been deleted (git history, 0cc4656),
 * and it re-punctuates two of the four failure modes into the clipped
 * three-beat form below; they were comma splices in the draft.
 *
 * Same discipline as `content/services.ts`: this file imports nothing, and every
 * string here is the client's own. The launch sequence is a reading of this
 * content, not an illustration invented alongside it — the draft's own hero note
 * asks for a rocket whose exhaust carries the things that burn away, and these
 * four are what the draft says those things are.
 *
 * The animation may not add a claim. If a fifth failure mode or a fourth stage
 * ever appears on screen, it appears here first.
 */

export interface GrowthStage {
  /** `strategy` etc. — used as a React key and a waypoint id. */
  id: string;
  label: string;
  body: string;
}

export interface FailureMode {
  id: string;
  label: string;
  body: string;
}

/**
 * The four things that fall away — "The Problem", four sub-headings.
 *
 * Order is the draft's. In the launch they detach from the rocket in this
 * order, which means the most expensive failure (wasted spend) is shed first
 * and the structural one (disconnected teams) last.
 */
export const FAILURE_MODES: readonly FailureMode[] = [
  {
    id: 'wasted-spend',
    label: 'Wasted Ad Spend',
    body: 'Campaigns launched without a clear strategy rarely hit a clear result. High cost. Low return. Repeat.',
  },
  {
    id: 'weak-identity',
    label: 'Weak Brand Identity',
    body: "If your brand can't explain itself in five seconds, most customers won't wait for the sixth.",
  },
  {
    id: 'wrong-platforms',
    label: 'Missing the Right Platforms',
    body: "Your customers are already online. The question is whether you're actually where they're looking.",
  },
  {
    id: 'disconnected',
    label: 'Disconnected Tools & Teams',
    body: 'Five freelancers. Ten tools. Zero alignment. It creates noise — not growth.',
  },
] as const;

/** The three waypoints on the ascent — the draft's "Our Growth Framework". */
export const GROWTH_STAGES: readonly GrowthStage[] = [
  {
    id: 'strategy',
    label: 'Strategy',
    body: 'We design data-driven marketing strategies tailored to your industry, audience, and stage of growth — so every campaign starts with a clear direction, not a guess.',
  },
  {
    id: 'execution',
    label: 'Execution',
    body: 'From paid ads and SEO to social and content production, our team executes campaigns built around real results, not just impressions.',
  },
  {
    id: 'automation',
    label: 'Automation',
    body: 'We implement AI-powered systems that streamline workflows, optimize campaigns, and help your business grow more efficiently at scale.',
  },
] as const;

/** Section headings and lead copy, also verbatim. */
export const LAUNCH_COPY = {
  problemHeading: 'The Problem',
  problemLead:
    "Most brands aren't struggling because they aren't trying. They're struggling because their marketing is scattered — across freelancers, tools, and platforms that were never built to talk to each other.",
  solutionHeading: 'The Solution',
  solutionLead:
    'Instead of juggling multiple agencies and platforms, you work with one strategic partner that owns your entire growth journey — from the first audit to the campaign that scales you past your last plateau.',
  frameworkHeading: 'Our Growth Framework',
} as const;

/**
 * The one line that is the section's thesis rather than a heading from the
 * draft. It states what the trajectory shows, for anyone who cannot see it.
 */
export const LAUNCH_THESIS = 'Growth is not a straight line.';
