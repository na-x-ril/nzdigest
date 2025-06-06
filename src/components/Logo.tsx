import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 58 56" // Adjusted viewBox for a snug fit around the letters
      // Default width/height can be set here, but className (e.g., h-6 w-6) usually overrides
      // width="24"
      // height="24"
      {...props} // Spread props first so className can override default width/height if they were set
    >
      <text
        x="2" // T remains in its original x position
        y="43" // Adjusted y for better vertical centering with Inter font
        fontFamily="Inter, sans-serif, Arial" // Added Arial as a common fallback
        fontSize="42" // Slightly adjusted font size for balance
        fontWeight="bold"
        fill="currentColor" // Inherits color from parent (e.g., text-primary)
      >
        T
      </text>
      <text
        x="20" // Moved D closer to T (was 26) for top bar merge effect
        y="43" // Adjusted y for better vertical centering
        fontFamily="Inter, sans-serif, Arial"
        fontSize="42"
        fontWeight="bold"
        fill="currentColor" // Inherits color from parent
      >
        D
      </text>
      {/* Play button triangle 'twist' inside D's visual area */}
      {/* Coordinates are fine-tuned to sit visually centered within the D, adjusted for D's new position */}
      <path
        d="M31 28 L38 24 V32 L31 28 Z" // X-coordinates shifted left by 6 (original M37 28 L44 24 V32 L37 28 Z)
        fill="hsl(var(--accent))"   // Accent color for the play button
      />
    </svg>
  );
}
