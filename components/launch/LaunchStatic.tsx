import { ProblemGrid } from './ProblemGrid';
import { SolutionSection } from './SolutionSection';

export function LaunchStatic() {
  return (
    <div id="qx-launch-static" className="mx-auto max-w-[var(--qx-shell)] px-4 md:px-6">
      {/* 3-Column Desktop Grid Problem Section */}
      <ProblemGrid />

      {/* Redesigned Solution Section with 4 Cards & Hero Character */}
      <SolutionSection />
    </div>
  );
}

